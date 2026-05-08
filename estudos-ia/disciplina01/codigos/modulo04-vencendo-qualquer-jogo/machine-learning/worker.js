importScripts('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest');

const MODEL_PATH = `yolov5n_web_model/model.json`;
const LABELS_PATH = `yolov5n_web_model/labels.json`;
const INPUT_MODEL_DIM = 640;
const CLASS_THRESHOLD = 0.4;

let _model = null;
let _labels = [];

async function loadModelAndLabels() {
    await tf.ready(); // inicialização do TensorFlow.js

    _labels = await (await fetch(LABELS_PATH)).json();
    _model = await tf.loadGraphModel(MODEL_PATH); // Carrega modelo YOLO.

    //warmup - apenas passa dado aleatório para o modelo ja realizar a etapa inicial 
    // que é mais demorada e ser mais rápido com os dados reais.
    const dummyInput = tf.ones(_model.inputs[0].shape);
    await _model.executeAsync(dummyInput);
    tf.dispose(dummyInput); // limpa objeto da memória

    postMessage({ type: 'model-loaded' });

}

loadModelAndLabels();

/**
 * Pré-processa a imagem para o formato aceito pelo YOLO:
 * - tf.browser.fromPixels(): converte ImageBitmap/ImageData para tensor [H, W, 3]
 * - tf.image.resizeBilinear(): redimensiona para [INPUT_DIM, INPUT_DIM]
 * - .div(255): normaliza os valores para [0, 1], inicialmente os valores vão de
 *   0 a 255 (256 inteiros, valor maximo que um pixel pode ter de RGB) em cada pixel da imagem. 
 * - .expandDims(0): adiciona dimensão batch [1, H, W, 3]
 *
 * Uso de tf.tidy():
 * - Garante que tensores temporários serão descartados automaticamente,
 *   evitando vazamento de memória.
 * 
 *  (semelhante ao using() do C#)
 */
function preProcessImage(input) {
    return tf.tidy(() => {
        const image = tf.browser.fromPixels(input);

        return tf.image.resizeBilinear(image, [INPUT_MODEL_DIM, INPUT_MODEL_DIM])
            .div(255).expandDims(0);
    });
}

async function runInference(tensor) {
    const output = await _model.executeAsync(tensor); // retorno do modelo YOLO após o envio
    // da imagem em formato de Tensor.
    tf.dispose(tensor);


    // Assume que as 3 primeiras saídas são:
    // caixas (boxes), pontuações (scores) e classes
    const [boxes, scores, classes] = output.slice(0, 3);
    const [boxesData, scoresData, classesData] = await Promise.all([
        boxes.data(),
        scores.data(),
        classes.data()
    ]);

    output.forEach(t => t.dispose());

    return {
        boxes: boxesData,
        scores: scoresData,
        classes: classesData
    }
}

/**
 * Filtra e processa as predições:
 * - Aplica o limiar de confiança (CLASS_THRESHOLD)
 * - Filtra apenas a classe desejada (exemplo: 'kite')
 * - Converte coordenadas normalizadas para pixels reais
 * - Calcula o centro do bounding box
 *
 * Uso de generator (function*):
 * - Permite enviar cada predição assim que processada, sem criar lista intermediária
 */
function* processPrediction({ boxes, scores, classes }, width, height) {

    for (let index = 0; index < scores.length; index++) {
        if (scores[index] < CLASS_THRESHOLD) continue;

        const label = _labels[classes[index]];
        if (label !== 'kite') continue;

        // cada número aqui representa a distancia horizontal/vertical do inicio e fim da caixa.
        let [x1, y1, x2, y2] = boxes.slice(index * 4, index * 4 + 4);

        // as variaveis acima recebem as coordenadas na dimensão que foi passada pro modelo: 640x640
        // é necessário a conversão delas para a dimensão da imagem que foi capturada em bitmap na main.js.

        //coordenadas reais da imagem do jogo no navegador
        x1 *= width;
        y1 *= height;
        x2 *= width;
        y2 *= height;

        // encontrar centro da box, que é onde o objeto está de fato e onde a mira da arma do jogo deve atirar.
        const boxWidth = x2 - x1;
        const boxHeight = y2 - y1;
        const centerX = x1 + (boxWidth / 2);
        const centerY = y1 + (boxHeight / 2);

        yield {
            x: centerX,
            y: centerY,
            score: (scores[index] * 100).toFixed(2) // exibir o score em porcentagem.
        }
    }
}

self.onmessage = async ({ data }) => {
    if (data.type !== 'predict') return
    // Todas vez que recebe uma imagem e um evento do tipo 'prediction', transforma em Tensor.

    if (!_model) return;

    const input = preProcessImage(data.image);
    const { width, height } = data.image
    const inferenceResults = await runInference(input);

    // a cada 200 milisegundos uma imagem nova chega, e esse método que faz a predição
    // dos objetos encontrados na imagem é chamado, os 200ms são definidos no 
    // setInterval da main.js
    for (const prediction of processPrediction(inferenceResults, width, height)) {
        postMessage({
            type: 'prediction',
            ...prediction
        });
    };
};

console.log('🧠 YOLOv5n Web Worker initialized');

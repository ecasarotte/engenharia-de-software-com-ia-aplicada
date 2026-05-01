import 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js';
import { workerEvents } from '../events/constants.js';

console.log('Model training worker initialized');
let _globalCtx = {};
let _model = null;
// Nesse caso, a rede leva em consideração a categoria como sendo o item mais importante para recomendação.
// Por esse motivo category tem um peso maior e será mais levado em consideração no treinamento.
// Poderia selecionar outro item como sendo prioritário, ou deixar todos com o mesmo peso.
const WEIGHTS = {
    category: 0.4,
    color: 0.3,
    price: 0.2,
    age: 0.1,
};

// 🔢 Normalize continuous values (price, age) to 0–1 range
// Why? Keeps all features balanced so no one dominates training
// Formula: (val - min) / (max - min)
// Example: price=129.99, minPrice=39.99, maxPrice=199.99 → 0.56
const normalize = (value, min, max) => (value - min) / ((max - min) || 1);

function makeContext(products, users) {
    const ages = users.map(u => u.age);
    const prices = products.map(p => p.price);

    const minAge = Math.min(...ages);
    const maxAge = Math.max(...ages);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);

    const colors = [...new Set(products.map(p => p.color))];
    const categories = [...new Set(products.map(p => p.category))];

    const colorsIndex = Object.fromEntries(
        colors.map((color, index) => {
            return [color, index]
        })
    );

    const categoriesIndex = Object.fromEntries(
        categories.map((category, index) => {
            return [category, index]
        })
    );

    // Computa a média de idade dos compradores, facilita personalização do treinamento.
    const midAge = (minAge + maxAge) / 2;
    const purchasesAgeSums = {}; // Soma da idade dos compradores de cada produto vendido
    const purchasesAgeCounts = {}; // Quantidade de compradores para cada produto vendido

    users.forEach(u => {
        u.purchases.map(p => {
            purchasesAgeSums[p.name] = (purchasesAgeSums[p.name] || 0) + u.age
            purchasesAgeCounts[p.name] = (purchasesAgeCounts[p.name] || 0) + 1
        })
    });

    // média de idade dos compradores de cada produto já normalizada
    // valores entre os ranges 0:1
    const productsAvgAgeNorm = Object.fromEntries(
        products.map(p => {
            const avgAgeByProduct = purchasesAgeCounts[p.name] ?
                purchasesAgeSums[p.name] / purchasesAgeCounts[p.name] :
                midAge

            return [p.name, normalize(avgAgeByProduct, minAge, maxAge)];
        })
    );

    return {
        products,
        users,
        colorsIndex,
        categoriesIndex,
        productsAvgAgeNorm,
        minAge,
        maxAge,
        minPrice,
        maxPrice,
        numCategories: categories.length,
        numColors: colors.length,
        // numero de dimensões do tensor, price + age + categories + colors
        // Ex: 2 + 4 + 8 = 14, o Array de entrada terá 14 entradas.
        dimensions: 2 + categories.length + colors.length
    }
}

// tf.oneHot(index, length) → Cria o vetor one-hot ex: [1, 0, 0, 0]
// cast('float32') → transforma em float [1, 0, 0, 0] → [1.0, 0.0, 0.0, 0.0]
// mul(weight) → Multiplica todos os valores por 0.3 → [0.0, 0.3, 0.0, 0.0]
/* 
    Sendo utilizado dessa maneira para que leve em consideração o peso dos atributos,
    Deixando ativo no tensor o valor do peso em vez de 1 sempre.
*/
const oneHotWeighted = (index, length, weight) => {
    return tf.oneHot(index, length).cast('float32').mul(weight);
};

// Percorre todos os produtos e normaliza os dados: 
// Idade média dos compradores, preço, categoria e cor de cada produto.
function encodeProduct(product, context) {
    // Normalizando dados para ficar de 0 a 1 e aplicando o peso inicial.
    const price = tf.tensor1d([
        normalize(product.price, context.minPrice, context.maxPrice) * WEIGHTS.price
    ]);

    const age = tf.tensor1d([
        (context.productsAvgAgeNorm[product.name] ?? 0.5) * WEIGHTS.age
    ]);

    const category = oneHotWeighted(
        context.categoriesIndex[product.category],
        context.numCategories,
        WEIGHTS.category
    );

    const color = oneHotWeighted(
        context.colorsIndex[product.color],
        context.numColors,
        WEIGHTS.color
    );

    //concatena os atributos em um único vetor
    return tf.concat1d([price, age, category, color]);
    debugger;
}

/*
    Essa função está criando uma representação vetorial do usuário com base nas compras dele.
    Definindo o comportamento médio desse usuário com base nos produtos que ele comprou.

    Ação:
    Transformar vários produtos comprados em um único vetor que resume o usuário.
*/
function encodeUser(user, context) {
    if (user.purchases.length) {
        // Empilha todos os vetores de produtos (compra) em um único tensor 2D.
        // Cada linha representa um produto codificado (embedding).
        return tf.stack(
            user.purchases.map(product => encodeProduct(product, context))
        )
            /* 
                mean(0) calcula a média ao longo do eixo 0 (linhas).
                Ou seja, pega todos os vetores dos produtos retornados do encodeProduct e gera
                um único vetor médio que representa o usuário.
                Cada usuário tem 1 vetor de compras que representa ele.
            */
            .mean(0)
            /* 
                reshape ajusta o formato do tensor para [1, dimensions], ou seja, 
                uma matriz com 1 linha e N colunas (features).
                Isso é útil para garantir compatibilidade com o modelo.
                No caso, context.dimensions = 14 colunas, número de colunas que um Tensor de produto deve ter.
            */
            .reshape([1, context.dimensions]);
    }

    // Caso o usuário ainda não possua nenhuma compra:
    return tf.concat1d(
        [
            tf.zeros([1]), // preço ignorado
            tf.tensor1d([
                normalize(user.age, context.minAge, context.maxAge) * WEIGHTS.age
            ]),
            tf.zeros([context.numCategories]), // categoria ignorada
            tf.zeros([context.numColors]), // cor ignorada
        ]
    ).reshape([1, context.dimensions]);
}

// ====================================================================
// 📌 Exemplo de como um usuário é ANTES da codificação
// ====================================================================
/*
const exampleUser = {
    id: 201,
    name: 'Rafael Souza',
    age: 27,
    purchases: [
        { id: 8, name: 'Boné Estiloso', category: 'acessórios', price: 39.99, color: 'preto' },
        { id: 9, name: 'Mochila Executiva', category: 'acessórios', price: 159.99, color: 'cinza' }
    ]
};
*/

// ====================================================================
// 📌 Após a codificação, o modelo NÃO vê nomes ou palavras.
// Ele vê um VETOR NUMÉRICO (todos normalizados entre 0–1).
// Exemplo: [preço_normalizado, idade_normalizada, cat_one_hot..., cor_one_hot...]
//
// Suponha categorias = ['acessórios', 'eletrônicos', 'vestuário']
// Suponha cores      = ['preto', 'cinza', 'azul']
//
// Para Rafael (idade 27, categoria: acessórios, cores: preto/cinza),
// o vetor poderia ficar assim:
//
// [
//   0.45,            // peso do preço normalizado
//   0.60,            // idade normalizada
//   1, 0, 0,         // one-hot de categoria (acessórios = ativo)
//   1, 0, 0          // one-hot de cores (preto e cinza ativos, azul inativo)
// ]
//
// São esses números que vão para a rede neural.
// ====================================================================

// ====================================================================
// 🧠 Configuração e treinamento da rede neural:
// ====================================================================
async function configureNeuralNetworkAndTrain(trainData) {
    const model = tf.sequential();

    // Camada de entrada
    // - inputShape: Número de features por exemplo de treino (trainData.inputDim)
    //   Exemplo: Se o vetor produto + usuário = 20 números, então inputDim = 20
    // - units: 128 neurônios (muitos "olhos" para detectar padrões)
    // - activation: 'relu' (mantém apenas sinais positivos, ajuda a aprender padrões não-lineares)
    model.add(
        tf.layers.dense({
            inputShape: [trainData.inputDimension],
            units: 128,
            activation: 'relu'
        })
    );
    // Camada oculta 1
    // - 64 neurônios (menos que a primeira camada: começa a comprimir informação)
    // - activation: 'relu' (ainda extraindo combinações relevantes de features)
    model.add(
        tf.layers.dense({
            units: 64,
            activation: 'relu'
        })
    );

    // Camada oculta 2
    // - 32 neurônios (mais estreita de novo, destilando as informações mais importantes)
    //   Exemplo: De muitos sinais, mantém apenas os padrões mais fortes
    // - activation: 'relu'
    model.add(
        tf.layers.dense({
            units: 32,
            activation: 'relu'
        })
    );

    // Camada de saída
    // - 1 neurônio porque vamos retornar apenas uma pontuação de recomendação
    // - activation: 'sigmoid' comprime o resultado para o intervalo 0–1
    // Exemplo: 0.9 = recomendação forte, 0.1 = recomendação fraca
    model.add(
        tf.layers.dense({ units: 1, activation: 'sigmoid' })
    );

    model.compile({
        optimizer: tf.train.adam(0.01),
        /* 
            Usado quando existem 3 ou mais classes, Ex: [Premium, Medium, basic], 1 neuronio por classe na saída.
            //loss: 'categoricalCrossentropy', 
        */

        /* 
            Usado quando só existem 2 possibilidades, Ex: (> 0.5) → classe 1, (< 0.5) → classe 0 
            Apenas 1 Neurônio na saída da ultima camada.
        */
        loss: 'binaryCrossentropy', 
        metrics: ['accuracy']
    });

    try {
        await model.fit(trainData.xs, trainData.ys, {
            epochs: 100,
            batchSize: 32,
            shuffle: true,
            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    console.log(`Epoch ${epoch}: loss=${logs.loss}, acc=${logs.acc}`);
                    postMessage({
                        type: workerEvents.trainingLog,
                        epoch: epoch,
                        loss: logs.loss,
                        accuracy: logs.acc
                    });
                }
            }
        });

    } catch (err) {
        console.error("ERRO NO TREINO:", err);
    }

    return model;
}

// Nesse projeto, a ideia é de que haja uma recomendação para compra para cada usuário,
// A recomendação é com base nas compras que esse cliente já efetuou anteriormente.
// features: [idade + preço + cores + categorias] labels: [true or false]; (comprou o produto pu não)
function createTrainingData(context) {
    const inputs = [];
    const labels = [];

    // filtra apenas os usuários que tenham feito compra para serem exemplos de treinamento.
    context.users.filter(u => u.purchases.length).forEach(user => {
        const userVector = encodeUser(user, context).dataSync();
        //Percorre os produtos e relaciona com cada usuário
        context.products.forEach(product => {
            const productVector = encodeProduct(product, context).dataSync();

            const label = user.purchases.some(purchase => purchase.name === product.name ? 1 : 0);
            //combinar user + product
            inputs.push([...userVector, ...productVector]);
            labels.push(label);
        });
    });

    return {
        xs: tf.tensor2d(inputs),
        ys: tf.tensor2d(labels, [labels.length, 1]),
        // tamanho = userVector + productVector
        inputDimension: context.dimensions * 2
    }
}

async function trainModel({ users }) {
    console.log('Training model with users:', users)

    const response = await fetch('/data/products.json');

    if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');

    if (!contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Resposta inesperada:', text);
        throw new Error('Não é JSON');
    }

    const products = await response.json();
    const context = makeContext(products, users);

    // productsVectors é o Tensor de produtos.
    context.productsVectors = products.map(product => {
        return {
            name: product.name,
            meta: { ...product },
            vector: encodeProduct(product, context).dataSync() // tensor de produto
        }
    });

    _globalCtx = context;

    const trainData = createTrainingData(context);
    _model = await configureNeuralNetworkAndTrain(trainData);

    postMessage({ type: workerEvents.progressUpdate, progress: { progress: 100 } });
    postMessage({ type: workerEvents.trainingComplete });

}
function recommend(user, ctx) {
    if (!_model) return;
    const context = _globalCtx;

    // 1️⃣ Converta o usuário fornecido no vetor de features codificadas
    //    Isso transforma as informações do usuário no mesmo formato numérico
    //    que foi usado para treinar o modelo.
    const userVector = encodeUser(user, context).dataSync();

    // Em aplicações reais:
    //  Armazene todos os vetores de produtos em um banco de dados vetorial (como Postgres, Neo4j ou Pinecone)
    //  Consulta: Encontre os 200 produtos mais próximos do vetor do usuário
    //  Execute _model.predict() apenas nesses produtos

    // 2️⃣ Crie pares de entrada: para cada produto, concatene o vetor do usuário
    //    com o vetor codificado do produto.
    //    Por quê? O modelo prevê o "score de compatibilidade" para cada par (usuário, produto).
    const inputs = context.productsVectors.map(({ vector }) => {
        return [...userVector, ...vector];
    });

    // 3️⃣ Converta todos esses pares (usuário, produto) em um único Tensor.
    //    Formato: [numProdutos, inputDim]
    const inputTensor = tf.tensor2d(inputs);

    // 4️⃣ Rode a rede neural treinada em todos os pares (usuário, produto) de uma vez.
    //    O resultado é uma pontuação para cada produto entre 0 e 1.
    //    Quanto maior, maior a probabilidade do usuário querer aquele produto.
    const predictions = _model.predict(inputTensor);

    // 5️⃣ Extraia as pontuações para um array JS normal.
    const scores = predictions.dataSync();

    const recommendations = context.productsVectors.map((item, index) =>{
        return {
            ...item.meta,
            name: item.name,
            score: scores[index] // previsão do modelo para este produto.
        }
    });

    const sortedItems = recommendations.sort((a, b) => b.score - a.score);

    // 8️⃣ Envie a lista ordenada de produtos recomendados
    //    para a thread principal (a UI pode exibi-los agora).
    postMessage({
        type: workerEvents.recommend,
        user,
        recommendations: sortedItems
    });
}

const handlers = {
    [workerEvents.trainModel]: trainModel,
    [workerEvents.recommend]: d => recommend(d.user, _globalCtx),
};

self.onmessage = e => {
    const { action, ...data } = e.data;
    if (handlers[action]) handlers[action](data);
};

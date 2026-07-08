#!/bin/bash
set -a
source .env
set +a

API_URL="https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_SITE_NAME="My Example"

NLP_MODEL="cohere/north-mini-code:free"
#google/gemma-4-31b-it:free

# curl https://openrouter.ai/api/v1/chat/completions \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer $OPENROUTER_API_KEY" \
#   -d '{
#   "model": "~openai/gpt-latest",
#   "messages": [
#     {
#       "role": "user",
#       "content": "What is the meaning of life?"
#     }
#   ]
# }'

echo "$NLP_MODEL"

curl --silent -X POST "$API_URL" \
-H "Content-Type: applicaton/json" \
-H "Authorization: Bearer $OPENROUTER_API_KEY" \
-d '{
  "model": "'$NLP_MODEL'",
  "messages": [
    {
      "role": "user",
      "content": "Como faço para aprender IA?"
    }
  ],
  "temperature": 0.3,
  "max_tokens": 1000
}' | jq

#cohere/north-mini-code:free
# {
#   "id": "gen-1782781037-dyC4i153kxuz8Bdt4xgB",
#   "object": "chat.completion",
#   "created": 1782781037,
#   "model": "cohere/north-mini-code-20260617:free",
#   "provider": "Cohere",
#   "system_fingerprint": null,
#   "service_tier": null,
#   "choices": [
#     {
#       "index": 0,
#       "logprobs": null,
#       "finish_reason": "length",
#       "native_finish_reason": "max_tokens",
#       "message": {
#         "role": "assistant",
#         "content": "Aprender IA pode parecer um objetivo ambicioso, mas, dividindo-o em etapas concretas, você pode avançar de forma constante e manter-se motivado. Abaixo está um roteiro prático, combinado com recursos, projetos e dicas para ajudá-lo a começar (ou a levar seu estudo a um nível mais avançado).\n\n---\n\n## 1️⃣ Comece com o básico\n\n| Habilidade | Por que é importante | Como aprender |\n|-------|----------------|-----------------|\n| **Programação (Python)** | A IA é implementada em código; o Python é a língua franca. | • Faça o curso gratuito “Python for Everybody” (Universidade de Michigan no Coursera) <br>• Pratique com o **Exercism**, **Codecademy** ou resolva problemas no **LeetCode** (filtro de fácil a médio). |\n| **Fundamentos de álgebra linear, cálculo e estatística** | Todas as fórmulas de IA/ML são construídas sobre esses conceitos. | • “Linear Algebra” (Khan Academy) <br>• “Calculus I/II” (Khan Academy) <br>• “Statistics” (Coursera – University of Washington) |\n| **Noções básicas de probabilidade e estatística** | Modelagem de incerteza, avaliação de modelos, inferência Bayesiana. | • “Probability & Statistics” (MIT OpenCourseWare) <br>• Capítulos 2 e 3 de *Pattern Recognition and Machine Learning* (Christopher Bishop) |\n\n**Dica:** Estude um pouco cada dia (15 a 30 minutos) em vez de tentar absorver tudo de uma vez. A repetição espaçada reforça o aprendizado.\n\n---\n\n## 2️⃣ Introdução à Inteligência Artificial e ao Aprendizado de Máquina\n\n### Aulas Estruturadas\n| Recurso | Instrutor/Autor | O que você aprenderá |\n|----------|----------------|-------------------|\n| **Machine Learning** (Coursera) | Andrew Ng | Fundamentos de ML: regressão linear/quadrática, SVM, árvores de decisão, rede neural, otimização. |\n| **Deep Learning Specialization** (Coursera) | Geoffrey Hinton, et al. | Redes neurais, backpropagation, CNNs, RNNs, otimização, regulação. |\n| **CS231n: Computer Vision** (Stanford) | Fei-Fei Li, et al. | Fundamentos de visão computacional, CNNs, pipelines de dados. |\n| **Introduction to Deep Learning** (fast.ai) | Jeremy Howard | Aprendizagem prática de deep learning com ferramentas de alto nível (fastai). |\n| **Machine Learning** (edX) | MIT | Versão mais teórica, com foco em modelos estatísticos. |\n\n### Leituras complementares\n* **“Artificial Intelligence: A Modern Approach”** (Russell & Norvig) – visão geral clássica.\n* **“Hands-On Machine Learning with Scikit-Learn, Keras & TensorFlow”** (Gerónimo) – projetos práticos com código.\n* **“Deep Learning with Python”** (François Chollet) – introdução amigável ao Keras.\n\n---\n\n## 3️⃣ Aprendizagem Prática: Projetos e Mini Cursos\n\n| Projeto | Tecnologias/Habilidades | Objetivo |\n|---------|--------------------|------|\n| **Classificador de imagens de cães vs. gatos** | Python → scikit-learn → Keras/TensorFlow | Pratique coleta de dados, pré-processamento, treinamento e avaliação de modelos. |\n| **Reconhecimento de escrita manual** | MNIST, PyTorch ou Keras | Entenda redes neurais totalmente conectadas e perda de classes ponderadas. |\n| **Chatbot simples** | NLP com `transformers` (Hugging Face) ou regras baseadas em NLTK | Introdução ao processamento de linguagem natural e pipelines de dados. |\n| **Previsão de séries temporais** | Pandas, Prophet ou LSTM | Aprenda sobre dados sequenciais e previs",
#         "refusal": null,
#         "reasoning": "The user asks \"How do I learn AI?\" This is a straightforward request for advice on learning artificial intelligence. No policy violation. Provide a comprehensive guide, resources, steps, suggestions for learning path, prerequisites, types of AI (ML, DL, NLP, etc.), recommended courses, books, online resources, practice projects, community, etc.\n\nWe should be helpful, thorough, and organized. Possibly include steps: basics of programming (Python), math (linear algebra, calculus, probability), fundamentals of ML, then deep learning, then specialized areas, then projects and continuous learning.\n\nWe can also suggest platforms: Coursera, edX, fast.ai, Andrew Ng, Geoffrey Hinton, etc. Provide a learning roadmap.\n\nWe should also mention building projects, using Kaggle, reading papers, joining communities, etc.\n\nWe need to be concise but thorough.\n\nWe should not mention policies. Just answer.\n\nProceed to final.",
#         "reasoning_details": [
#           {
#             "type": "reasoning.text",
#             "text": "The user asks \"How do I learn AI?\" This is a straightforward request for advice on learning artificial intelligence. No policy violation. Provide a comprehensive guide, resources, steps, suggestions for learning path, prerequisites, types of AI (ML, DL, NLP, etc.), recommended courses, books, online resources, practice projects, community, etc.\n\nWe should be helpful, thorough, and organized. Possibly include steps: basics of programming (Python), math (linear algebra, calculus, probability), fundamentals of ML, then deep learning, then specialized areas, then projects and continuous learning.\n\nWe can also suggest platforms: Coursera, edX, fast.ai, Andrew Ng, Geoffrey Hinton, etc. Provide a learning roadmap.\n\nWe should also mention building projects, using Kaggle, reading papers, joining communities, etc.\n\nWe need to be concise but thorough.\n\nWe should not mention policies. Just answer.\n\nProceed to final.",
#             "format": "unknown",
#             "index": 0
#           }
#         ]
#       }
#     }
#   ],
#   "usage": {
#     "prompt_tokens": 6,
#     "completion_tokens": 997,
#     "total_tokens": 1003,
#     "cost": 0,
#     "is_byok": false,
#     "prompt_tokens_details": {
#       "cached_tokens": 0,
#       "cache_write_tokens": 0,
#       "audio_tokens": 0,
#       "video_tokens": 0
#     },
#     "cost_details": {
#       "upstream_inference_cost": 0,
#       "upstream_inference_prompt_cost": 0,
#       "upstream_inference_completions_cost": 0
#     },
#     "completion_tokens_details": {
#       "reasoning_tokens": 239,
#       "image_tokens": 0,
#       "audio_tokens": 0
#     }
#   }
# }
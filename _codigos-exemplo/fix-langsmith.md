# Sempre que iniciar um novo projeto de uma nova aula o langsmith pode apresentar problemas devido a versão do CLI do NPX.
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './stream' is not defined by "exports"

*FIX*

# 1. Confira a versão do Node e as dependências
node -v
npm ls @langchain/langgraph @langchain/langgraph-cli @langchain/core langchain

# 2. Atualize as dependências LangGraph em conjunto
npm install @langchain/langgraph @langchain/core
npm install --save-dev @langchain/langgraph-cli

# 3. Use o CLI local no script (package.json)
"scripts": {
  "langgraph:serve": "langgraphjs dev"
}

# 4. Confira se a dependência que causava o erro existe (Se o primeiro comando imprimir Import OK, o subcaminho está disponível na versão instalada).
node --input-type=module -e 'await import("@langchain/langgraph/stream"); console.log("Import OK")'
npm ls @langchain/langgraph @langchain/langgraph-cli @langchain/core langchain

# 5. Inicie o servidor (podendo ser utilizado com o comando ntl normalmente).
npm run langgraph:serve  

# 6. Baixar as dependências do projeto:
npm ci
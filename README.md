# Tic Task - Sistema de Gerenciamento de Tarefas de Alta Performance

Este projeto foi desenvolvido como parte do Projeto Integrador em Computação Paralela, focando na resolução de gargalos em sistemas de gerenciamento de tarefas através de arquitetura assíncrona e processamento paralelo.

## Tecnologias Utilizadas
- **Linguagem:** Node.js
- **Banco de Dados:** MySQL
- **Mensageria e Cache:** Redis
- **Autenticação:** JWT (JSON Web Tokens)
- **Testes de Carga:** K6

## Arquitetura
O sistema é composto por três pilares principais:
1. **API (Interface):** Responsável pela validação e recepção das requisições do usuário.
2. **Fila (Redis):** Gerencia o fluxo de tarefas, garantindo o desacoplamento entre a entrada do dado e o seu processamento.
3. **Worker:** Motor de processamento paralelo responsável por executar as tarefas de forma assíncrona, garantindo a escalabilidade do sistema.

## Performance
O sistema foi submetido a testes de estresse, demonstrando alta resiliência sob carga, com capacidade de processar milhares de requisições mantendo baixos tempos de resposta.

## Como rodar o projeto
1. Clone o repositório.
2. Configure o ambiente (Node.js, MySQL e Redis).
3. Instale as dependências: `npm install`
4. Execute o sistema: `npm start`

---

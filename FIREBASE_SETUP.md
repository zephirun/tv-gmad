# Configuração do Firebase para TV Corporativa

Para que o sistema de upload de arquivos e sincronização em tempo real funcione, você precisa configurar um projeto no Firebase.

## 1. Criar Projeto no Firebase
1. Acesse [console.firebase.google.com](https://console.firebase.google.com).
2. Clique em **"Adicionar projeto"**.
3. Dê um nome (ex: `gmad-tv-corporativa`).
4. Desative o Google Analytics (não é necessário para este projeto).
5. Clique em **"Criar projeto"**.

## 2. Configurar Autenticação e Banco de Dados

### Authentication (Login)
1. No menu lateral, clique em **Criação** > **Authentication**.
2. Clique em **"Vamos começar"**.
3. Na aba **Sign-in method**, ative o provedor **Anônimo**.
   - Isso permite que as TVs se conectem sem login manual.

### Firestore Database (Dados)
1. No menu lateral, clique em **Criação** > **Firestore Database**.
2. Clique em **"Criar banco de dados"**.
3. Escolha a localização (ex: `sao-paulo` ou `us-central1`).
4. **Importante:** Escolha iniciar no **Modo de teste** (permite leitura/escrita por 30 dias enquanto desenvolve).
   - *Nota: Em produção, você deverá configurar regras de segurança.*

### Storage (Arquivos de Mídia)
1. No menu lateral, clique em **Criação** > **Storage**.
2. Clique em **"Vamos começar"**.
3. Inicie no **Modo de teste**.
4. Clique em **Concluir**.
5. Vá na aba **Rules** (Regras) do Storage e certifique-se que permite leitura/escrita:
   ```
   allow read, write: if true;
   ```

## 3. Conectar o Código ao Firebase

1. No console do Firebase, clique na **Engrenagem** (⚙️) ao lado de "Visão geral do projeto" > **Configurações do projeto**.
2. Role até o final da página e clique no ícone **</> (Web)**.
3. Registre o app com um apelido (ex: `Painel Web`).
4. Copie as credenciais que aparecem no objeto `firebaseConfig`.
5. Abra o arquivo `.env.local` na pasta do seu projeto.
6. Preencha os campos com os valores copiados:

```env
VITE_FIREBASE_API_KEY="seu-api-key"
VITE_FIREBASE_AUTH_DOMAIN="seu-projeto.firebaseapp.com"
...
```

## 4. Instalação de Dependências (Se necessário)

Se o comando `npm run dev` ou `npm install` falhar devido a caminhos de rede (`\\server\...`), siga estes passos:

1. Mapeie o caminho da rede para uma letra de unidade (ex: `Z:`):
   - Abra o Explorer, clique com botão direito em "Este Computador" > "Mapear unidade de rede".
   - Cole o caminho: `\\i-120-001-102\Madville-Users$\ruan.wilt\Meus Documentos`.
2. Abra o terminal na nova unidade (ex: `Z:\Projetos\TV Corporativa`).
3. Execute:
   ```powershell
   npm install
   ```

## Resumo dos Arquivos Criados
- **src/firebase/client.js**: Arquivo central de conexão.
- **.env.local**: Onde você guarda as senhas (nunca envie isso para o GitHub!).

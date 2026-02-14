# Manual de Deploy e Atualização - TV Corporativa GMAD

## Opção 1: Rodar na Vercel (Recomendado)
A maneira mais fácil e profissional. Não depende de computadores ligados na empresa.

1. Crie uma conta em [vercel.com](https://vercel.com) (Grátis).
2. Instale o Vercel CLI no terminal:
   ```cmd
   npm i -g vercel
   ```
3. Na pasta do projeto, rode:
   ```cmd
   vercel login
   vercel
   ```
   (Aceite as opções padrão. O projeto chama-se `tv-corporativa-gmad`).
4. **Pronto!** Seu link oficial é:
   👉 **https://tv-corporativa-gmad.vercel.app**

### Como atualizar na Vercel?
Sempre que fizer uma alteração no código:
1. Rode:
   ```cmd
   vercel --prod
   ```
2. A atualização será enviada para o site.
3. Desligue e ligue a TV (ou recarregue a página) para ver as mudanças.

---

## Opção 2: Servidor Local (PC Windows)
Se preferir rodar em um PC da rede interna.

### Instalação
1. Escolha um PC que ficará **sempre ligado**.
2. Instale um servidor simples globalmente:
   ```cmd
   npm install -g serve
   ```
3. Gere a versão final do site:
   ```cmd
   npm run build
   ```
4. Inicie o servidor (apontando para a pasta `dist` que foi criada):
   ```cmd
   serve -s dist -l 3000
   ```
   (O site ficará em `http://IP-DO-COMPUTADOR:3000`)

5. **Na TV:** Abra o navegador e digite o IP e porta.
   Exemplo: `http://192.168.1.50:3000`

### Como atualizar no Servidor Local?
1. Faça as alterações no código.
2. Rode `npm run build` novamente.
3. O comando `serve` (se já estiver rodando) vai servir os arquivos novos automaticamente.
4. Reinicie a TV (ou recarregue a página) para pegar a nova versão.

---

## Dicas Importantes para TV
*   **Vídeos:** Sempre use MP4 (Codec H.264) e resolução 1080p. Vídeos 4K ou codecs estranhos (VP9) podem travar a TV.
*   **Wi-Fi:** Garanta que o sinal de Wi-Fi na TV seja forte, pois o conteúdo (imagens/vídeos) é baixado da internet (ou do servidor local).
*   **Cache:** Se fizer uma alteração e a TV não mostrar, desligue a TV da tomada por 10 segundos para limpar a memória temporária do navegador.

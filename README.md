# Downloader (GitHub Actions)

Este repositório tem como único propósito a utilização do **GitHub Actions** para automatizar o download de arquivos diretamente para a infraestrutura do GitHub.

## Como funciona

Os workflows localizados em `.github/workflows` utilizam a largura de banda e o armazenamento temporário do GitHub para baixar conteúdos específicos via linha de comando.

## Como usar

1. Vá até a aba **Actions** no topo do repositório.
2. No menu à esquerda, selecione o workflow que deseja executar.
3. Clique no botão **Run workflow**.
4. Se o workflow solicitar parâmetros (como URLs), preencha-os e clique em **Run workflow**.

### Notas
*   Este é um repositório de utilidade pessoal.
*   Os arquivos baixados geralmente ficam disponíveis nos **Artifacts** da execução ou são enviados para destinos externos, dependendo da configuração do `.yml`.

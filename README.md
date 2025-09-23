# Brainstorm de Nomes

Um aplicativo web simples para brainstorming de nomes de projetos, produtos ou qualquer outra coisa. Usuários podem sugerir nomes, votar nos nomes existentes e filtrar a lista com base em critérios como disponibilidade de domínio.

## Tecnologias Utilizadas

*   **Java 17**
*   **Spring Boot 3**
*   **Maven**
*   **Spring Web**: Para criar a aplicação web e APIs REST.
*   **Spring Data JPA**: Para persistência de dados.
*   **Thymeleaf**: Como template engine para renderizar as páginas HTML.
*   **H2 Database**: Banco de dados em memória para desenvolvimento.
*   **Tailwind CSS**: Para a estilização do frontend.

## Pré-requisitos

*   **Java 17** ou superior.
*   **Apache Maven** 3.6 ou superior.

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    ```
2.  **Navegue até o diretório do projeto:**
    ```bash
    cd <NOME_DO_DIRETORIO>
    ```
3.  **Execute o projeto com o Maven:**
    ```bash
    mvn spring-boot:run
    ```
    *Nota: O projeto pode conter um Maven Wrapper (`mvnw`). Se sim, prefira usar `./mvnw spring-boot:run` (Linux/macOS) ou `mvnw.cmd spring-boot:run` (Windows).*

4.  **Acesse a aplicação:**
    Abra seu navegador e acesse `http://localhost:8080`.

## Guia de Testes Manuais

### 1. Login

1.  Ao acessar `http://localhost:8080` pela primeira vez, você será direcionado para a página de login.
2.  Digite qualquer nome de usuário no campo de texto (ex: "Jules") e clique em "Entrar".
3.  Você será redirecionado para a página principal da aplicação, agora logado. Seu nome de usuário deve aparecer no canto superior direito.

### 2. Sugerir um Novo Nome

1.  Na página principal, localize a seção "Sugerir um Novo Nome".
2.  Digite um nome de sua escolha no campo de texto (ex: "Projeto Apollo").
3.  Clique no botão "Sugerir".
4.  A página será recarregada e sua nova sugestão aparecerá na lista, com 0 votos.

### 3. Votação

1.  Encontre uma sugestão na lista.
2.  Para votar a favor, clique no ícone de fogo (🔥). O contador de votos deve aumentar em 1.
3.  Para votar contra, clique no ícone de floco de neve (❄️). O contador de votos deve diminuir em 1.
4.  A votação é feita de forma assíncrona, então a página não será recarregada.

### 4. Filtros

1.  Acima da lista de nomes, você encontrará os botões de filtro: "Todos", "✅ Domínio Disponível", "✅ Marca Disponível" e "Mais Recentes".
2.  Clique em qualquer um dos filtros para ver a lista de sugestões ser atualizada de acordo com o critério selecionado.
    *   **Todos**: Mostra todas as sugestões, ordenadas por mais votados.
    *   **Domínio Disponível**: Mostra apenas nomes cujo domínio simulado está disponível.
    *   **Marca Disponível**: Mostra apenas nomes cuja marca simulada está disponível no INPI.
    *   **Mais Recentes**: Mostra as sugestões mais recentes primeiro.
3.  O botão do filtro ativo ficará com uma cor de fundo diferente.

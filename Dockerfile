# --- Estágio de Build ---
# Usa uma imagem Maven com Java 17 para compilar a aplicação
FROM maven:3.8.5-openjdk-17 AS build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia o pom.xml primeiro para aproveitar o cache de dependências do Docker
COPY pom.xml .
RUN mvn dependency:go-offline

# Copia o resto do código fonte
COPY src ./src

# Compila a aplicação e gera o ficheiro .jar
RUN mvn clean install -DskipTests

# --- Estágio de Execução ---
# Usa uma imagem muito mais leve, apenas com o Java Runtime
FROM openjdk:17-jre-slim

# Define o diretório de trabalho
WORKDIR /app

# Copia o ficheiro .jar gerado no estágio de build
COPY --from=build /app/target/*.jar app.jar

# Expõe a porta 8080 (padrão do Spring Boot)
EXPOSE 8080

# Comando para iniciar a aplicação quando o container arrancar
ENTRYPOINT ["java", "-jar", "app.jar"]

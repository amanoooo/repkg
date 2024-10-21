FROM mcr.microsoft.com/dotnet/sdk:6.0

RUN apt-get update && \
    apt-get install -y curl gnupg && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

RUN node -v && npm -v

WORKDIR /app

ADD ConsoleApp/bin/Release/net6.0/publish .

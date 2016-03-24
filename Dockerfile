FROM iojs:latest

RUN apt-get update && apt-get install -y supervisor
RUN curl -o /usr/bin/confd https://github.com/kelseyhightower/confd/releases/download/v0.9.0/confd-0.9.0-linux-amd64
RUN chmod 755 /usr/bin/confd

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/confd.conf /etc/confd/conf.d/app.toml
COPY docker/.env.tmpl .env.tmpl

RUN npm install

EXPOSE 3000
CMD ["/usr/bin/supervisord"]

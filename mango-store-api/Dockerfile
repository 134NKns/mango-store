FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libonig-dev \
    libzip-dev \
    zip \
    unzip \
    mariadb-client \
    && docker-php-ext-install pdo_mysql

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY . .

RUN composer install --no-scripts --no-autoloader

RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

RUN sed -i 's/DB_CONNECTION=mysql/DB_CONNECTION=mysql/' .env && \
    sed -i 's/DB_HOST=127.0.0.1/DB_HOST=db/' .env && \
    sed -i 's/DB_DATABASE=laravel/DB_DATABASE=mango_store/' .env && \
    sed -i 's/DB_USERNAME=root/DB_USERNAME=root/' .env && \
    sed -i 's/DB_PASSWORD=/DB_PASSWORD=secret/' .env

COPY wait-for-it.sh /usr/local/bin/wait-for-it.sh
RUN chmod +x /usr/local/bin/wait-for-it.sh

# Set ServerName to localhost to prevent Apache warning
RUN echo "ServerName localhost" >> /etc/apache2/conf-available/servername.conf
RUN a2enconf servername

# Seed the database and start Apache
CMD ["sh", "-c", "wait-for-it.sh db:3306 -- php artisan key:generate && php artisan migrate && php artisan db:seed && apache2-foreground"]

EXPOSE 80

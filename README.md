# Sam Edu - Hệ thống Quản lý Giáo dục Đa Trung tâm (SaaS)

![Laravel](https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-v3.0-9553E9?style=for-the-badge&logo=inertia&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.0+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)

**sam-edu** là hệ thống phần mềm quản lý giáo dục đa trung tâm đào tạo theo mô hình SaaS (Software as a Service). Hệ thống hỗ trợ dùng thử 14 ngày, tự động tính toán thời hạn hết hạn (`expires_at`), và tích hợp cổng thanh toán **ZaloPay QR Code v2** để tự động gia hạn gói dịch vụ.

---

## 📋 Mục lục

1. [Tính năng & Kiến trúc Cốt lõi](#-tính-năng--kiến-trúc-cốt-lõi)
2. [Tech Stack](#-tech-stack)
3. [Hướng dẫn Cài đặt Môi trường Local](#-hướng-dẫn-cài-đặt-môi-trường-local)
4. [Hướng dẫn Build & Deploy Server Production](#-hướng-dẫn-build--deploy-server-production)
   - [4.1 Yêu cầu Server](#41-yêu-cầu-server)
   - [4.2 Cài đặt Môi trường Server (Ubuntu 22.04 / 24.04)](#42-cài-đặt-môi-trường-server-ubuntu-2204--2404)
   - [4.3 Quy trình Deploy Dự án](#43-quy-trình-deploy-dự-án)
   - [4.4 Cấu hình Nginx Web Server](#44-cấu-hình-nginx-web-server)
   - [4.5 Cấu hình SSL / HTTPS (Let's Encrypt)](#45-cấu-hình-ssl--https-lets-encrypt)
   - [4.6 Cấu hình Supervisor (Queue Worker)](#46-cấu-hình-supervisor-queue-worker)
   - [4.7 Cấu hình Cron Job (Task Scheduler)](#47-cấu-hình-cron-job-task-scheduler)
   - [4.8 Script Tự động hóa Deployment (`deploy.sh`)](#48-script-tự-động-hóa-deployment-deploysh)
5. [Quy trình Kiểm tra & Quality Assurance](#-quy-trình-kiểm-tra--quality-assurance)
6. [Cấu trúc Database (36 Migrations)](#-cấu-trúc-database-36-migrations)

---

## 🏛️ Tính năng & Kiến trúc Cốt lõi

- **Không sử dụng bảng `users`**: Hệ thống quản lý tài khoản qua 3 bảng độc lập với Guard riêng:
  - `admins`: Quản trị viên hệ thống (Super Admin) & Quản trị viên trung tâm (Center Admin).
  - `teachers`: Giáo viên giảng dạy.
  - `students`: Học sinh.
- **Không có bảng `parents` riêng**: Thông tin liên hệ người thân/phụ huynh được quản lý trực tiếp trong các thuộc tính của học sinh (`parent_name`, `parent_phone`, `parent_relationship`).
- **Môn học gắn liền cấp độ**: Bảng `subjects` chứa tên môn học bao gồm cấp độ (VD: *Tiếng Trung Sơ Cấp K1*, *Toán 12 Nâng Cao*). Học phí và học phần cấu hình theo trung tâm ở `center_subjects`.
- **Phân lớp Backend chuẩn (Layered Architecture)**: `Controller` -> `Service (Interface)` -> `Repository (Interface)`.
- **Phân quyền dữ liệu & Thống kê**:
  - Super Admin: Xem toàn bộ dữ liệu & thống kê tất cả trung tâm.
  - Center Admin: Chỉ truy cập trung tâm được phân công trong `admin_centers`.
  - Teacher: Chỉ truy cập các lớp học phụ trách giảng dạy.
  - Student: Bị từ chối xem thống kê hệ thống (HTTP 403).
- **Thanh toán & Đăng ký gói (SaaS)**: Tích hợp ZaloPay QR Code v2 tự động tạo đơn hàng, nhận Webhook callback và nâng cấp/gia hạn gói tự động cho trung tâm.

---

## 💻 Tech Stack

| Thành phần | Công nghệ / Thư viện |
| :--- | :--- |
| **Backend Framework** | Laravel 13.x + PHP 8.3+ |
| **Frontend Framework** | React 19 + Vite 6 + Inertia.js v3 |
| **CSS Engine** | Tailwind CSS v4 + Custom Design System (`resources/css/components.css`) |
| **UI Components** | Custom UI theo chuẩn `shadcn/ui` (`Button`, `Input`, `Card`, `Modal`, `DataTable`, `Badge`) |
| **Icons & Charts** | `lucide-react`, `recharts` |
| **State Management** | `zustand` |
| **Form & Validation** | `react-hook-form` + `zod` |
| **HTTP Client** | `axios` (với Bearer Token Interceptor & CSRF Auto-refresh) |
| **Database** | MySQL 8.0+ |

---

## 🛠️ Hướng dẫn Cài đặt Môi trường Local

### Yêu cầu tối thiểu:
- PHP 8.3+ (bắt buộc hỗ trợ các extension: `pdo`, `pdo_mysql`, `mbstring`, `openssl`, `bcmath`, `curl`, `xml`, `zip`)
- Composer 2.x
- Node.js 20.x+ & npm / pnpm
- MySQL 8.0+

### Các bước cài đặt:

1. **Clone repository:**
   ```bash
   git clone git@github.com:NBPhuc88/sam-edu.git
   cd sam-edu
   ```

2. **Cài đặt các gói phụ thuộc Backend & Frontend:**
   ```bash
   composer install
   npm install
   ```

3. **Cấu hình file môi trường `.env`:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Cấu hình kết nối MySQL trong `.env`:**
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sam_edu
   DB_USERNAME=root
   DB_PASSWORD=your_password
   ```

5. **Chạy Migration & Seeder dữ liệu mẫu:**
   ```bash
   php artisan migrate --seed
   ```

6. **Tạo Symbolic Link lưu trữ file upload:**
   ```bash
   php artisan storage:link
   ```

7. **Khởi chạy Server ở môi trường Local:**
   - Chạy Frontend Vite Dev Server:
     ```bash
     npm run dev
     ```
   - Chạy Backend Laravel Server (Terminal riêng):
     ```bash
     php artisan serve
     ```

---

## 🚀 Hướng dẫn Build & Deploy Server Production

### 4.1 Yêu cầu Server
- **OS**: Ubuntu 22.04 LTS hoặc Ubuntu 24.04 LTS (Khuyên dùng).
- **RAM**: Tối thiểu 2GB RAM (Khuyên dùng 4GB+ RAM cho build Vite/React).
- **CPU**: 2 Cores+.
- **Software**: Nginx, PHP 8.3-FPM, MySQL 8.0, Node.js 20+ LTS, Supervisor, Certbot.

---

### 4.2 Cài đặt Môi trường Server (Ubuntu 22.04 / 24.04)

Chạy các lệnh sau dưới quyền `root` hoặc `sudo` trên server Ubuntu:

```bash
# 1. Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# 2. Cài đặt các công cụ cơ bản
sudo apt install -y curl git unzip software-properties-common ufw supervisor

# 3. Cài đặt PHP 8.3 & các extensions cần thiết
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring \
    php8.3-xml php8.3-bcmath php8.3-curl php8.3-zip php8.3-gd php8.3-intl php8.3-opcache

# 4. Cài đặt Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer
sudo chmod +x /usr/local/bin/composer

# 5. Cài đặt Node.js 20 LTS (Nodesource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 6. Cài đặt Nginx & MySQL Server
sudo apt install -y nginx mysql-server
```

---

### 4.3 Quy trình Deploy Dự án

1. **Clone dự án về thư mục web (`/var/www/sam-edu`):**
   ```bash
   sudo mkdir -p /var/www/sam-edu
   sudo chown -R $USER:$USER /var/www/sam-edu
   git clone git@github.com:NBPhuc88/sam-edu.git /var/www/sam-edu
   cd /var/www/sam-edu
   ```

2. **Thiết lập Phân quyền Thư mục (Permissions):**
   ```bash
   sudo chown -R www-data:www-data /var/www/sam-edu
   sudo find /var/www/sam-edu -type f -exec chmod 644 {} \;
   sudo find /var/www/sam-edu -type d -exec chmod 755 {} \;
   sudo chmod -R 775 /var/www/sam-edu/storage /var/www/sam-edu/bootstrap/cache
   ```

3. **Tạo File `.env` Môi trường Production:**
   ```bash
   cp .env.example .env
   nano .env
   ```
   *Cấu hình quan trọng trong `.env`:*
   ```env
   APP_NAME="Sam Edu"
   APP_ENV=production
   APP_DEBUG=false
   APP_URL=https://your-domain.com

   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=sam_edu
   DB_USERNAME=sam_edu_user
   DB_PASSWORD=Secure_Password_Here

   SESSION_DRIVER=database
   QUEUE_CONNECTION=database
   CACHE_STORE=database

   ZALOPAY_APP_ID=your_zalopay_app_id
   ZALOPAY_KEY1=your_zalopay_key1
   ZALOPAY_KEY2=your_zalopay_key2
   ZALOPAY_ENDPOINT=https://openapi.zalopay.vn/v2/create
   ZALOPAY_QUERY_ENDPOINT=https://openapi.zalopay.vn/v2/query
   ZALOPAY_CALLBACK_URL=https://your-domain.com/api/payments/zalopay/callback
   ```

4. **Cài đặt PHP Dependencies & Generate App Key:**
   ```bash
   composer install --no-dev --optimize-autoloader
   php artisan key:generate
   ```

5. **Cài đặt Node Dependencies & Build Frontend Production Assets:**
   ```bash
   npm ci
   npm run build
   ```

6. **Chạy Migration Cơ sở dữ liệu & Link Storage:**
   ```bash
   php artisan migrate --force
   php artisan db:seed --force # Nếu cần tạo dữ liệu khởi tạo mặc định
   php artisan storage:link
   ```

7. **Tối ưu hóa Performance Laravel (Cache Configuration, Routes, Views):**
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   php artisan event:cache
   ```

---

### 4.4 Cấu hình Nginx Web Server

Tạo file cấu hình Virtual Host cho Nginx:

```bash
sudo nano /etc/nginx/sites-available/sam-edu
```

Dán nội dung cấu hình chuẩn bên dưới vào file:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-domain.com www.your-domain.com;
    root /var/www/sam-edu/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    index index.php;
    charset utf-8;

    # Cấu hình dung lượng upload tối đa
    client_max_body_size 64M;

    # Nginx Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Kích hoạt cấu hình Nginx và kiểm tra syntax:

```bash
sudo ln -s /etc/nginx/sites-available/sam-edu /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### 4.5 Cấu hình SSL / HTTPS (Let's Encrypt)

Cài đặt Certbot và tự động kích hoạt HTTPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot sẽ tự động gia hạn chứng chỉ SSL thông qua systemd timer.

---

### 4.6 Cấu hình Supervisor (Queue Worker)

Hệ thống sử dụng Laravel Queue để xử lý bất đồng bộ các giao dịch ZaloPay và gửi thông báo. Tạo file cấu hình Supervisor:

```bash
sudo nano /etc/supervisor/conf.d/sam-edu-worker.conf
```

Nội dung file:

```ini
[program:sam-edu-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/sam-edu/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/sam-edu/storage/logs/worker.log
stopwaitsecs=3600
```

Khởi chạy Worker qua Supervisor:

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start sam-edu-worker:*
```

---

### 4.7 Cấu hình Cron Job (Task Scheduler)

Laravel Task Scheduler chịu trách nhiệm tự động kiểm tra thời hạn hết hạn gói đăng ký (`expires_at`) và gửi thông báo cảnh báo.

Mở crontab của user `www-data`:

```bash
sudo crontab -u www-data -e
```

Thêm dòng sau vào cuối file:

```cron
* * * * * cd /var/www/sam-edu && php artisan schedule:run >> /dev/null 2>&1
```

---

### 4.8 Script Tự động hóa Deployment (`deploy.sh`)

Tạo script deploy nhanh khi có phiên bản cập nhật code mới:

```bash
nano /var/www/sam-edu/deploy.sh
```

Nội dung script:

```bash
#!/usr/bin/env bash
set -e

echo "🚀 Bắt đầu quá trình Deploy sam-edu..."

# Bật chế độ bảo trì
php artisan down || true

# Cập nhật code mới từ Git
git pull origin main

# Cài đặt PHP dependencies
composer install --no-dev --optimize-autoloader

# Cài đặt Node dependencies & Build Frontend
npm ci
npm run build

# Chạy Database Migration
php artisan migrate --force

# Cập nhật Cache Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Restart Queue Worker
sudo supervisorctl restart sam-edu-worker:*

# Tắt chế độ bảo trì
php artisan up

echo "✅ Deploy thành công!"
```

Cấp quyền thực thi cho script:
```bash
chmod +x /var/www/sam-edu/deploy.sh
```

---

## 🧪 Quy trình Kiểm tra & Quality Assurance

Trước khi commit code hoặc đẩy lên server production, dự án yêu cầu bắt buộc phải chạy 4 lệnh kiểm tra sau đạt **0 lỗi**:

```bash
# 1. Kiểm tra Build Frontend (Vite)
npm run build

# 2. Kiểm tra TypeScript & ESLint
npm run lint && npx tsc --noEmit

# 3. Kiểm tra định dạng Code PHP Style (Laravel Pint)
vendor/bin/pint

# 4. Kiểm tra Kiểu Tĩnh PHPStan Level 7
composer types:check
```

---

## 🗄️ Cấu trúc Database (36 Migrations)

```text
01. centers                     19. exams
02. admins                      20. exam_results
03. teachers                    21. exam_result_histories
04. students                    22. student_notes
05. refresh_tokens              23. student_documents
06. admin_centers               24. notifications
09. subjects                    25. notification_recipients
10. center_subjects             26. roles
11. rooms                       27. permissions
12. classes                     28. role_permissions
13. class_students              29. admin_roles
14. class_schedules             30. teacher_roles
15. class_sessions              31. student_roles
16. session_reschedules         32. center_subscriptions
17. session_reschedules         33. payment_transactions
18. attendances                 34. system_settings
                                35. subscription_plans
                                36. contact_requests
```

---

## 📄 Giấy phép (License)

Dự án thuộc bản quyền của **Sam Edu**. Mọi quyền được bảo lưu.

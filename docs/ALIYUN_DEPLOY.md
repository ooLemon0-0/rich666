# 阿里云 Ubuntu 部署指南（rich666）

本文目标：从 0 开始，把本项目部署到阿里云 Ubuntu，并通过服务器公网 IP 访问。

## 0. 安全组与端口

在阿里云控制台 -> ECS -> 安全组，放通入方向：

- `80/tcp`：给 Nginx HTTP 访问
- `443/tcp`：预留 HTTPS（即使当前没域名，也建议先放通）
- `3000/tcp`：可选，仅调试后端时放通（生产建议只开放 80/443）

如果启用了 Ubuntu 防火墙（ufw），执行：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw status
```

## 1. 安装运行环境

```bash
sudo apt update
sudo apt install -y curl git nginx
```

安装 Node.js 20 LTS（推荐）：

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

安装 PM2：

```bash
sudo npm install -g pm2
pm2 -v
```

## 2. 拉取代码

```bash
cd /opt
sudo git clone https://github.com/ooLemon0-0/rich666.git
sudo chown -R $USER:$USER /opt/rich666
cd /opt/rich666
```

## 3. 安装依赖与构建

本仓库当前可直接用 npm workspaces：

```bash
npm install
npm run build
```

构建产物：

- 前端：`apps/web/dist`
- 后端：`apps/server/dist`

## 4. 启动后端（PM2）

项目根目录已提供 `ecosystem.config.cjs`。

```bash
cd /opt/rich666
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

检查后端状态：

```bash
pm2 status
pm2 logs rich666-server --lines 100
curl http://127.0.0.1:3000/health
```

预期返回类似：

```json
{"ok":true,"ts":1700000000000}
```

## 5. 部署前端静态文件到 Nginx 目录

```bash
sudo mkdir -p /var/www/rich666/web
sudo cp -r /opt/rich666/apps/web/dist/* /var/www/rich666/web/
```

## 6. 配置 Nginx（含 Socket.IO 反代）

复制示例配置并替换 IP：

```bash
sudo cp /opt/rich666/docs/nginx.conf.example /etc/nginx/conf.d/rich666.conf
sudo sed -i "s/<YOUR_SERVER_IP>/你的服务器公网IP/g" /etc/nginx/conf.d/rich666.conf
```

测试并重载：

```bash
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## 7. 访问验证

浏览器访问：

```text
http://你的服务器公网IP
```

如果前端连接后端失败，先检查：

1. `apps/web` 的 `VITE_SERVER_URL` 是否指向 `http://你的服务器公网IP`（或 Nginx 反代路径）
2. Nginx `/socket.io/` 反代是否生效
3. `pm2 logs rich666-server` 是否有连接日志

## 8. 更新发布流程（后续迭代）

每次更新代码后：

```bash
cd /opt/rich666
git pull origin main
npm install
npm run build
sudo cp -r /opt/rich666/apps/web/dist/* /var/www/rich666/web/
pm2 restart rich666-server
sudo nginx -t && sudo systemctl reload nginx
```

## 9. 生产建议（可后续做）

- 仅开放 `80/443`，关闭公网 `3000`
- 配置 HTTPS（域名 + Let's Encrypt）
- Nginx 增加 gzip / cache headers
- PM2 增加 log rotate（`pm2 install pm2-logrotate`）

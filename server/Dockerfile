# syntax=docker/dockerfile:1
FROM node:22-slim

WORKDIR /app

# 安装 pnpm 8.x（避免构建脚本批准问题）
RUN npm install -g pnpm@8

# 安装构建工具（原生模块需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 pnpm 锁文件和 package.json
COPY pnpm-lock.yaml ./
COPY package.json ./

COPY pnpm-workspace.yaml ./

# 使用 pnpm 安装生产依赖（不使用 frozen-lockfile 以允许更新）
# 使用 --unsafe-perm 允许构建脚本运行
RUN pnpm install --prod --no-frozen-lockfile --unsafe-perm

# 清理构建工具
RUN apt-get purge -y python3 make g++ \
    && apt-get autoremove -y \
    && apt-get clean

# 复制构建产物和环境变量
COPY dist/ ./dist/
COPY .env ./

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# 启动应用
CMD ["node", "dist/main.js"]

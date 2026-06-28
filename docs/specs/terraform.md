# Terraform インフラ設計定義書

## 1. Terraform 導入要件
* **プロバイダー**: cloudflare/cloudflare
* **ステート管理**: Terraform Cloud または Cloudflare R2
* **環境分離**: Workspace または Directory 分割
* **秘匿情報**: 環境変数 `TF_VAR_` 経由で注入

---

## 2. 構成リソース定義

### A. Compute & Storage
* **cloudflare_d1_database**: `mine-imposer-db` (戦績・ユーザー用)
* **cloudflare_worker_script**: ゲームサーバー (Durable Objects 定義込)
* **cloudflare_worker_domain**: API/WS 用カスタムドメイン

### B. Frontend
* **cloudflare_pages_project**: Nuxt.js ホスティング

---

## 3. 基本ディレクトリ構造

terraform/
├── environments/
│   ├── staging/
│   └── production/
├── modules/
│   ├── d1/
│   ├── workers/
│   └── pages/
├── main.tf
├── variables.tf
├── outputs.tf
└── providers.tf

---

## 4. プロバイダー設定例

terraform {
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

---

## 5. インフラ層の制約
* D1 スキーマ (DDL) は Terraform 外のマイグレーションツールで管理。
* Workers への Binding (D1, DO, KV) はすべて Terraform で明示的に定義する。

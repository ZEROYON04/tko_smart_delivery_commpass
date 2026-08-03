# スマート配送コンパス in 広島

配送直前に受取人の予定が変わっても、受取方法を簡単に変更できる配送支援システムの動作確認モックです。

受取人が「対面受取」から「置き配」へ変更すると、Supabase Realtimeを通じてドライバー画面へ反映されます。配送順は固定したまま、短縮された滞在時間を使って後続地点の到着予定時刻（ETA）だけを前倒しします。

> 配送情報・経路はモックです。LINE Messaging APIは公式アカウントと接続して動作確認できます。Amazon Location Serviceと配送会社データには接続していません。

## 技術スタック

- Next.js 16.2.12（App Router / Route Handler）
- React 19.2.4 / TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL / Realtime / CLI
- Zod
- Vitest
- pnpm 11.9.0以上
- Node.js 24.18.1以上

## デモで確認できること

- 6件の固定配送コース
- 配送順とモック経路の表示
- 対面受取（滞在300秒）と置き配（滞在10秒）の変更
- 受取方法変更後の後続ETA再計算
- 配送順が変化しないこと
- ドライバー画面へのRealtime反映
- 配達完了・不在処理
- ブラウザ位置情報を使ったドライバー現在地更新
- バージョン番号を使った同時更新防止
- 初回1回のお客様コードによるLINE連携
- 当日朝の配送予定・時間帯通知（二重送信防止）
- LINEからの「今日は受け取れない」連絡
- 配達直前の「あと何件・約何分」通知
- LINEからの在宅・10分不在・30分不在連絡
- 受取人画面を開く36時間有効の署名付きリンク

LINE連携の準備と発表用の進行は [LINE連携デモガイド](docs/line-demo.md) を参照してください。

## デモID

```text
配送コース:
00000000-0000-4000-8000-000000000001

受取人デモ（3件目）:
00000000-0000-4000-8000-000000000103
```

## 初回セットアップ（WSL Ubuntu）

### 1. fnmのインストール

```bash
curl -fsSL https://fnm.vercel.app/install | bash
source ~/.bashrc
fnm --version
```

### 2. Node.jsと依存パッケージ

```bash
cd /mnt/c/ゲーム制作/GitHub/tko_smart_delivery_commpass
fnm install 24.18.1
fnm use 24.18.1
node --version
pnpm --version
pnpm install
```

期待値：

```text
Node.js v24.18.1以上
pnpm 11.9.0以上
```

### 3. 環境変数

```bash
cp .env.template .env
```

Docker Desktopを起動してSupabaseを立ち上げます。

```bash
pnpm exec supabase start
```

起動結果の `Project URL`、`Publishable`、`Secret` を `.env` に設定します。

```env
NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3000
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<Publishable Key>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Publishable Key>

SUPABASE_SERVICE_ROLE_KEY=<Secret Key>

NEXT_PUBLIC_DEMO_RUN_ID=00000000-0000-4000-8000-000000000001
NEXT_PUBLIC_DEMO_DELIVERY_ID=00000000-0000-4000-8000-000000000103
ROUTING_PROVIDER=mock
```

`SUPABASE_SERVICE_ROLE_KEY`には絶対に `NEXT_PUBLIC_` を付けないでください。また、`.env` はGitへコミットしないでください。

### 4. DBの初期化

```bash
pnpm exec supabase db reset
```

マイグレーションと `supabase/seed.sql` が適用され、固定UUIDのデモデータ6件が作成されます。

## 日常の起動方法

Docker Desktopを起動後、WSLで以下を実行します。

```bash
cd /mnt/c/ゲーム制作/GitHub/tko_smart_delivery_commpass
fnm use 24.18.1
pnpm exec supabase start
pnpm dev --hostname 0.0.0.0
```

Next.jsを停止せずSupabase操作を行う場合は、ターミナルを2つ開いてください。

## 確認URL

- トップページ: http://localhost:3000
- ドライバー画面: http://localhost:3000/driver
- 受取人画面: http://localhost:3000/recipient/00000000-0000-4000-8000-000000000103
- Supabase Studio: http://localhost:54323
- Mailpit: http://localhost:54324

## デモ手順

LINE連携を含むデモは [LINE連携デモガイド](docs/line-demo.md) の手順を使用してください。以下は受取方法・ETA再計算だけを確認する従来のWebデモです。

1. ドライバー画面と受取人画面を別タブで開く
2. 両方の画面で3件目が「対面受取・滞在5分」であることを確認
3. 受取人画面で「置き配へ変更する」を押す
4. 滞在時間が10秒へ変わることを確認
5. ドライバー画面へ変更通知が表示されることを確認
6. 4件目以降のETAが4分50秒ずつ前倒しされることを確認
7. 配送順が1〜6のままであることを確認
8. ページを再読み込みしても変更が保持されることを確認

デモ状態を元に戻す場合：

```bash
pnpm exec supabase db reset
```

## 品質確認

```bash
pnpm lint
pnpm test
pnpm build
```

ETAの単体テストでは、290秒の短縮、配送順維持、複数置き配、完了地点のETA保持を確認します。

## PC・スマートフォンからの確認

PCだけで確認する場合は、`.env` のURLを `127.0.0.1` のまま使用します。

同じLANのスマートフォンから確認する場合は、`ipconfig` でPCのIPv4アドレスを調べ、以下を変更してNext.jsを再起動します。

```env
NEXT_PUBLIC_SITE_URL=http://192.168.x.x:3000
NEXT_PUBLIC_SUPABASE_URL=http://192.168.x.x:54321
```

アクセス例：

```text
http://192.168.x.x:3000
```

Windows Firewallは、信頼できるPrivateネットワークのLocalSubnetに限りTCP 3000と54321を許可してください。公衆Wi-Fiや不特定多数が接続するLANでは開放しないでください。Studio（54323）やDB（54322）はLANへ公開しないでください。

## WSL・Docker Desktopの注意点

- Docker Desktopの `Settings > Resources > WSL Integration` でUbuntuを有効化します。
- `Cannot connect to the Docker daemon` の場合はDocker Desktopの起動完了を待ちます。
- 改善しない場合はPowerShellで `wsl --shutdown` を実行し、Docker Desktopを再起動します。
- Windowsドライブ（`/mnt/c/...`）上では、初回の依存導入やビルドに時間がかかる場合があります。

`.wslconfig` の例：

```ini
[wsl2]
networkingMode=mirrored
```

設定後はPowerShellでWSLを再起動します。

```powershell
wsl --shutdown
```

## 終了方法

Next.jsは起動中のターミナルで `Ctrl+C` を押します。

```bash
pnpm exec supabase stop
exit
```

必要に応じてPowerShellでWSLを停止します。

```powershell
wsl --shutdown
```

## データとセキュリティ

- 全テーブルでRLSを有効化
- ブラウザはデモ表示に必要なSELECTのみ許可
- INSERT / UPDATEはNext.js Route HandlerからService Role Keyで実行
- 受取方法変更はDB関数内でバージョン照合、履歴保存、ETA再計算を一括実行
- `route_stops.stop_order` は更新しない
- シードデータはすべて架空の地域名・ダミー受取人名

## モック経路計算

現在は `MockRoutingProvider` を使用します。

1. Haversine公式で直線距離を計算
2. 道路距離として1.3倍
3. 平均時速25kmで所要時間を計算

画面上の経路・距離は実道路ナビゲーションではありません。

## 将来の差し替え箇所

### LINE

LINE Messaging APIのPush・Reply・Webhookを実装済みです。現在は当日朝の通知をドライバー画面のデモボタンから実行し、配達直前通知も各荷物のボタンから実行します。本番では同じAPIをEventBridge Schedulerなどから呼び出します。

### AWS

`lib/routing/RoutingProvider` の実装を `MockRoutingProvider` からAmazon Location Service実装へ差し替えます。画面・DBの責務は維持できます。

### 認証

現在は固定デモユーザーです。本番ではSupabase Authを使い、ドライバー・配送管理者ごとのアクセス制御へ差し替えます。

## 現在の未実装範囲

- 配達直前通知のスケジュール自動実行
- LINE連携解除・お客様コード再発行の運用画面
- Amazon Location Service / Google Maps
- 本番用ドライバー認証・受取人認証
- 配送ルートの自動最適化
- 本物の配送会社データ
- 地域ポイント、ユーザースコア、複数配送会社対応

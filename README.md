# スマ配（スマート配送）in 広島

配送直前に受取人の予定が変わっても、受取方法を簡単に変更できる配送支援システムの動作確認モックです。

受取人が「対面受取」から「置き配」へ変更すると、Supabase Realtimeを通じてドライバー画面へ反映されます。通常の受取方法変更では配送順を固定したまま、短縮された滞在時間を使って後続地点の到着予定時刻（ETA）だけを前倒しします。不在・時間帯変更時だけ、在宅予定と配送枠を守るように残りの配送順を再最適化します。

> このリポジトリはモック環境です。地図表示にはMapLibre GLとOpenStreetMap、道路経路にはOpenStreetMapデータを利用するOSRMの公開デモサービスを使用します。LINE Messaging APIは公式アカウントと接続して動作確認できますが、配送会社システム、ドライバー認証、Amazon Location Serviceには接続していません。

## 技術スタック

- Next.js 16.2.12（App Router / Route Handler）
- React 19.2.4 / TypeScript
- Tailwind CSS v4
- Supabase PostgreSQL / Realtime / CLI
- MapLibre GL / OpenStreetMap
- OSRM（道路経路・時間行列）
- Zod
- Vitest
- pnpm 11.9.0以上
- Node.js 24.18.1以上

## デモで確認できること

- 東広島市内の実在する公共施設6地点を使ったデモ配送コース
- 実道路に沿った配送経路・走行距離・所要時間の地図表示
- 対面受取（滞在300秒）と置き配（滞在10秒）の変更
- ドライバー画面で玄関前・宅配ボックスなどの置き配場所を指定
- 配送日の変更と、時間枠・残りルート・ETAの一括再計算
- 受取方法変更後の後続ETA再計算
- 通常の受取方法変更では配送順が変化しないこと
- 不在時の「あと何分で戻るか」を使った再配達順の再計算
- ヤマト運輸・佐川急便・ゆうパック別の配達時間枠
- 指定枠に収まらない場合の次枠／翌日枠への自動再配置
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
発表で使う90秒の操作順は [発表用デモストーリー](docs/demo-story.md) にまとめています。

## デモID

```text
配送コース:
00000000-0000-4000-8000-000000000001

受取人デモ（主役・最初の訪問先／お客様コード USER-C）:
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
NEXT_PUBLIC_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=https://router.project-osrm.org
```

`SUPABASE_SERVICE_ROLE_KEY`には絶対に `NEXT_PUBLIC_` を付けないでください。また、`.env` はGitへコミットしないでください。公開OpenStreetMapタイルは動作確認用とし、本番では利用規約と負荷要件に合うタイルプロバイダーへ差し替えてください。

### 4. DBの初期化

```bash
pnpm exec supabase db reset
```

マイグレーションと `supabase/seed.sql` が適用され、固定UUIDのデモデータ6件が作成されます。

## 日常の起動方法

### まとめて起動する場合（macOS）

Docker Desktopを起動してから、プロジェクトのルートで次の1コマンドを実行します。

```bash
fnm use 24.18.1
pnpm demo:start
```

Supabase、LINE Webhookプロキシ、Cloudflareトンネル、Next.jsが順番に起動します。Cloudflareの一時URLは `.env` の `LINE_PUBLIC_SITE_URL` へ自動反映されます。一時URLが前回と変わった場合は、表示されたWebhook URLをLINE Developersへ設定してください。

LINEからの受信を確認せず、PC内だけで起動する場合は次を使用します。

```bash
pnpm demo:local
```

終了するときは、同じターミナルで `Control+C` を押します。Supabaseが残っている場合や、別のターミナルから確実に停止したい場合は次を実行します。

```bash
pnpm demo:stop
```

### 個別に起動する場合

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

LINE連携を含む設定は [LINE連携デモガイド](docs/line-demo.md)、発表中の操作順とセリフは [発表用デモストーリー](docs/demo-story.md) を使用してください。

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

単体テストでは、290秒の短縮、通常変更時の配送順維持、会社別時間枠、次枠への繰り越し、在宅予定を待ち時間として活用するルート最適化を確認します。

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
- 受取方法の変更だけでは `route_stops.stop_order` を更新しない
- 不在・配達時間帯変更・手動再最適化の場合だけ残りの配送順を更新
- シード住所は東広島市役所、美術館、駅、道の駅、大学、支所など実在する公開施設を使用
- 受取人名はデモ用の架空名であり、個人宅・電話番号などの個人情報は保存しない

## 実道路経路とフォールバック

標準設定では `OsrmRoutingProvider` がOSRM Route ServiceとTable Serviceを利用します。

1. 全配送先の走行時間・道路距離行列を取得
2. 在宅可能時刻と会社別配送枠を満たす順序を探索
3. 選ばれた順序の道路形状をGeoJSON相当の座標列として保存
4. MapLibre GLとOpenStreetMapで道路経路、拠点、配送先、ドライバー位置を表示

OSRMへ接続できない場合は、自動的に `MockRoutingProvider` へフォールバックします。公開OSRMにはSLAがないため、本番運用ではセルフホストまたはAmazon Location Service等へ差し替えてください。地図タイルも本番運用では専用プロバイダーまたはセルフホストへ差し替えてください。

## 会社別の配達時間帯

- ヤマト運輸: 午前中、14～16時、16～18時、18～20時、19～21時
- 佐川急便: 午前中、12～14時、14～16時、16～18時、18～20時、18～21時、19～21時
- 日本郵便・ゆうパック: 午前中、12～14時頃、14～16時頃、16～18時頃、18～20時頃、19～21時頃

時間帯定義は `lib/scheduling/time-slots.ts` に集約しています。

## 将来の差し替え箇所

### LINE

LINE Messaging APIのPush・Reply・Webhookを実装済みです。現在は当日朝の通知をドライバー画面のデモボタンから実行し、配達直前通知も各荷物のボタンから実行します。本番では同じAPIをEventBridge Schedulerなどから呼び出します。

### AWS

`lib/routing/RoutingProvider` の `OsrmRoutingProvider` をAmazon Location Service実装へ差し替えます。画面・DB・時間枠最適化の責務は維持できます。

### 認証

現在は固定デモユーザーです。本番ではSupabase Authを使い、ドライバー・配送管理者ごとのアクセス制御へ差し替えます。

## 現在の未実装範囲

- 配達直前通知のスケジュール自動実行
- LINE連携解除・お客様コード再発行の運用画面
- Amazon Location Serviceや商用地図タイルの本番向け契約・運用設計
- 本番用ドライバー認証・受取人認証
- 交通渋滞、通行止め、車種制限を含むリアルタイム交通情報
- 配送会社APIから取得する本番の荷物・時間帯データ
- 地域ポイント、ユーザースコア、複数配送会社対応

### fnm のインストール

```bash
curl -fsSL [https://fnm.vercel.app/install](https://fnm.vercel.app/install) | bash
```

インストール後の確認コマンド:

```bash
fnm --version
```

### リポジトリのクローン

GitHub への SSH 接続テストを行います（エラーが出る場合は GitHub に SSH 鍵が登録されているか確認してください）。

```bash
ssh -T git@github.com
```

リポジトリをクローンしたいディレクトリに移動し、クローンを実行します。

```bash
git clone git@github.com:ZEROYON04/tko_smart_delivery_commpass.git
```

### Node のインストール

リポジトリのディレクトリに移動します。

```bash
cd tko_smart_delivery_commpass
```

Node をインストールし、本プロジェクトのバージョン（24.18.1）を有効化します。

```bash
fnm install 24.18.1
fnm use 24.18.1
```

確認コマンド:

```bash
node --version
```

※バージョンが **24.18.1** であることを必ず確認してください。

### 6. ライブラリのインストール

```bash
pnpm install
```

上記のコマンドを実行することで、`package.json` に記載された必要なパッケージがすべてダウンロードされます。

# ネットワーク設定

### 1. WSL のネットワーク設定

以下の設定ファイルを作成します。
`C:Users\<自分のユーザ名>\.wslconfig`

```
[wsl2]
networkingMode=mirrored
```

その後 WSL を再起動します。

```PowerShell
wsl --shutdown
# その後WSLにアクセスすれば勝手に起動する
```

### 2. Windows のファイアウォールを許可する

PowerShell を管理者権限で立ち上げます。
使用する適切なポート番号を有効化してください。
supabase や expo で使用するポート番号のインバウンドの通信を以下のコマンドを使って許可します。なおルールは作成するだけで勝手に有効化されます。
無効化・有効化はルールの作成後に実行できます。

ルールの作成

`New-NetFirewallRule -DisplayName "<ルール名>" -Direction Inbound -LocalPort <ポート番号> -Action Allow -Protocol TCP`

ルールの削除

`Remove-NetFirewallRule -DisplayName "<ルール名>"`

ルールの無効化

`Set-NetFirewallRule -DisplayName "<ルール名>" -Enabled False`

ルールの有効化

`Set-NetFirewallRule -DisplayName "<ルール名>" -Enabled True`

- [ファイアウォール関連の問題に役立つかもしれない記事](https://qiita.com/bake_rin_co/items/a8cad04efc80c8f94c10#%E5%AE%9F%E6%A9%9F%E3%81%A7%E5%8B%95%E4%BD%9C%E7%A2%BA%E8%AA%8D)

⚠️ **注意**
**開発をするときには決して公衆 LAN などの不特定多数が接続する LAN でデモや動作確認の作業しないでください**
またセキュリティ上開発をしていない間はルールを無効化するのを強く推奨します。特に公衆 LAN や不特定多数の人間がアクセスする LAN ではルールを無効化しないと、ファイアウォールを突破されて PC にアクセスされる可能性があるので注意してください。

# ローカル環境の立ち上げ

以下はすべて、プロジェクトのルートディレクトリ（`tko_smart_delivery_commpass`）でコマンドを実行してください。

### 1. 環境変数ファイルの準備

```bash
cp .env.template .env
```

※リポジトリ側のテンプレートファイル名が `.env.tempate` の場合は、実際の名称に合わせてコマンドを適宜修正してください。

### 2. Supabase の起動

```bash
pnpm exec supabase start
```

Supabase が起動すると、ターミナルに `Authentication Keys` や各種 URL（`API URL` など）が表示されます。

- `.env` ファイルを開き、対応する環境変数のキーにそれぞれの値をコピペしてください。
- その際、URL に含まれる `localhost` または `127.0.0.1` の部分は、**PC のプライベート IP アドレス**（例: `192.168.X.X`）に置き換えてください。

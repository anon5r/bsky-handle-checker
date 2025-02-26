Discord Bot の使い方
===================

## Discord Bot の招待

Discord Developers Portalから登録したBotをDiscordサーバーに招待します。

あるいは、[こちらのリンク](https://discord.com/oauth2/authorize?client_id=1317435746877050890&permissions=18432&integration_type=0&scope=bot+applications.commands)からBotアカウントを招待してください。

![Discord bot account](https://github.com/user-attachments/assets/af06a450-b860-44f2-89ac-214a51f610fd)

Botの招待にはDiscordサーバーの管理者権限が必要です。


## Botのコマンド一覧

インストールすると以下のコマンドを使用できます。

`/add-domain [domain]`
---
監視したいドメインを登録します。登録したドメインがカスタムハンドル設定として有効になると通知されます。

`/remove-domain [domain]`
---
ドメインを監視対象から削除します。

`/list-domains`
---
登録されているドメイン一覧を表示します。

`/channel connect [channel]`
---
結果通知を受け取るチャンネルを設定または変更します。
設定できるチャンネルはパブリックなテキストチャンネルである必要があります。

>[!NOTE]
> このコマンドはサーバー管理者権限またはチャンネル管理権限が必要です。

`/channel disconnect`
---
結果通知を受け取るチャンネルを解除します。

>[!NOTE]
> このコマンドはサーバー管理者権限またはチャンネル管理権限が必要です。

`/channel currnet`
---
現在設定されているチャンネル名を表示します。

>[!NOTE]
> このコマンドはサーバー管理者権限またはチャンネル管理権限が必要です。


## 通知の例

監視対象に設定されたドメインがカスタムハンドルとして見つかると、以下のスクリーンショットのような通知が、設定したチャンネルに送信されます。
![通知サンプル](https://github.com/user-attachments/assets/457fe953-32a0-4d0b-9aa9-3d03d69953b6)

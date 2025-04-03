How to Use the Discord Bot
===================

## Inviting the Discord Bot

Invite the Bot registered on the Discord Developers Portal to your Discord server.

Alternatively, you can invite the Bot account from [this link](https://discord.com/oauth2/authorize?client_id=1317435746877050890&permissions=18432&integration_type=0&scope=bot+applications.commands).

![Discord bot account](https://github.com/user-attachments/assets/af06a450-b860-44f2-89ac-214a51f610fd)

Administrator permissions for the Discord server are required to invite the Bot.


## List of Bot Commands

The following commands are available after installation:

`/add-domain [domain]`
---
Register a domain you want to monitor. You will be notified when the registered domain becomes valid as a custom handle setting.

`/remove-domain [domain]`
---
Remove a domain from the monitoring list.

`/list-domains`
---
Display a list of registered domains.

`/channel connect [channel]`
---
Set or change the channel to receive result notifications.
The channel must be a public text channel.

>[!NOTE]
> This command requires server administrator permissions or channel management permissions.

`/channel disconnect`
---
Disconnect the channel that receives result notifications.

>[!NOTE]
> This command requires server administrator permissions or channel management permissions.

`/channel currnet`
---
Display the name of the currently set channel.

>[!NOTE]
> This command requires server administrator permissions or channel management permissions.


## Notification Example

When a domain set as a monitoring target is found as a custom handle, a notification like the screenshot below will be sent to the configured channel.
![Notification sample](https://github.com/user-attachments/assets/457fe953-32a0-4d0b-9aa9-3d03d69953b6)

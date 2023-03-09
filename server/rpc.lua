local nk = require('nakama')
local common = require('common')

local function add_inviter(context, payload)
    local decoded = nk.json_decode(payload)
    local inviter_id = decoded['user_id']

    local account = nk.account_get_id(context.user_id)
    local userMetadata = account.user.metadata
    local inviter = userMetadata['inviter']

    if inviter_id ~= context.user_id and not inviter then
        userMetadata['inviter'] = inviter_id
        nk.account_update_id(context.user_id, userMetadata)
        nk.notification_send(inviter_id, "invite", {point = 10000},
                             common.NOTI_INVITER, nil, false)
        return nk.json_encode({success = true})
    end
end

local function get_reward_noti(context, payload)
    local decoded = nk.json_decode(payload)
    local noti_id = decoded['id']
    local content = decoded['content']
    local code = decoded['code']
    local type = ""
    if code == 10 then type = "invite friend" end

    local target = {user_id = context.user_id, notification_id = noti_id}
    local error = nk.notifications_delete({target})

    if not error then
        nk.wallet_update(context.user_id, content, {type = type}, true)
        return nk.json_encode({success = true})
    end
end

nk.register_rpc(add_inviter, 'add_inviter')
nk.register_rpc(get_reward_noti, 'get_reward_noti')

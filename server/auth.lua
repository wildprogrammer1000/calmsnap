local nk = require('nakama')
local card = require('card')

local function after_authenticate(context, payload)
    if payload["created"] then
        local changeset = {draw = 8}
        local w_metadata = {type = "first_login"}
        nk.wallet_update(context.user_id, changeset, w_metadata, true)
    end
end

nk.register_req_after(after_authenticate, "AuthenticateCustom")

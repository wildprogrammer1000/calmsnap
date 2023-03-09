local nk = require('nakama')
local ability = {
    card_1 = {cost = 1, power = 1},
    card_2 = {cost = 1, power = 1},
    card_3 = {cost = 1, power = 1},
    card_4 = {cost = 1, power = 1},
    card_5 = {cost = 1, power = 2},
    card_6 = {cost = 1, power = 2},
    card_7 = {cost = 1, power = 2},
    card_8 = {cost = 2, power = 2},
    card_9 = {cost = 2, power = 2},
    card_10 = {cost = 2, power = 2},
    card_11 = {cost = 2, power = 2},
    card_12 = {cost = 2, power = 3},
    card_13 = {cost = 2, power = 3},
    card_14 = {cost = 2, power = 3},
    card_15 = {cost = 3, power = 3},
    card_16 = {cost = 3, power = 3},
    card_17 = {cost = 3, power = 4},
    card_18 = {cost = 3, power = 4},
    card_19 = {cost = 3, power = 4},
    card_20 = {cost = 4, power = 4},
    card_21 = {cost = 4, power = 4},
    card_22 = {cost = 4, power = 5},
    card_23 = {cost = 4, power = 5},
    card_24 = {cost = 4, power = 5},
    card_25 = {cost = 5, power = 5},
    card_26 = {cost = 5, power = 5},
    card_27 = {cost = 5, power = 6},
    card_28 = {cost = 5, power = 6},
    card_29 = {cost = 6, power = 7},
    card_30 = {cost = 6, power = 7}
}

local function findEmpty(arr)
    local index = -1
    for i = 1, #arr do
        if arr[i] == "" then
            index = i
            break
        end
    end
    return index
end

local function checkDuplication(arr, el)
    local duplicated = false
    local index = -1
    for i, v in ipairs(arr) do
        if el == v then
            duplicated = true
            index = i
            break
        end
    end
    return duplicated, index
end

local function get_card_info(context, payload)
    local storage_config = {{collection = "card", key = "list"}}
    local storages = nk.storage_read(storage_config)
    if #storages > 0 then return nk.json_encode(storages[1].value.card) end

end

local function try_draw_card(context, payload)
    local account = nk.account_get_id(context.user_id)
    local wallet = account.wallet

    if wallet["draw"] == 0 then
        return nk.json_encode({success = false, error = 1})
    end

    local storage_config = {{collection = "shop", key = 'card'}}
    local storages = nk.storage_read(storage_config)
    local cards = storages[1].value.card

    local rand = math.random(1, 30)
    local card = 'card_' .. rand
    print(card)
    if wallet[card] then
        local rand_point = math.random(20, 100)
        local changeset = {point = rand_point, draw = -1}
        local w_metadata = {type = "draw", point = rand_point}
        nk.wallet_update(context.user_id, changeset, w_metadata, true)
        return nk.json_encode({success = true, point = rand_point})
    else
        local changeset = {[card] = 1, draw = -1}
        local w_metadata = {type = 'draw', card = card}
        nk.wallet_update(context.user_id, changeset, w_metadata, true)
        return nk.json_encode({success = true, card = card})
    end
end

local function add_deck(context, payload)
    local account = nk.account_get_id(context.user_id)
    local userMetadata = account.user.metadata

    local deck = userMetadata['deck']
    local new_deck = {"", "", "", "", "", "", "", ""}
    if deck then
        table.insert(userMetadata['deck'], new_deck)
    else
        userMetadata['deck'] = {new_deck}
    end
    local updated = nk.account_update_id(context.user_id, userMetadata)
    return nk.json_encode({success = true})
end

local function modify_deck(context, payload)
    local account = nk.account_get_id(context.user_id)
    local userMetadata = account.user.metadata
    local wallet = account.wallet

    local decoded = nk.json_decode(payload)
    if not wallet[decoded['card']] or wallet[decoded['card']] == 0 then
        return
    end

    local deck = userMetadata['deck']
    local targetDeck = deck[decoded["deck_index"]]

    local duplicated, d_index = checkDuplication(targetDeck, decoded['card'])
    if duplicated then
        targetDeck[d_index] = ""
        deck[decoded['deck_index']] = targetDeck
        nk.account_update_id(context.user_id, userMetadata)
        return nk.json_encode({success = true})
    else
        local index = findEmpty(targetDeck)

        if index ~= -1 then
            targetDeck[index] = decoded['card']
            deck[decoded['deck_index']] = targetDeck
            nk.account_update_id(context.user_id, userMetadata)
            return nk.json_encode({success = true})
        end
    end
end

local function delete_deck(context, payload)
    local account = nk.account_get_id(context.user_id)
    local userMetadata = account.user.metadata
    local decks = userMetadata['deck']

    if not decks then return end

    local decoded = nk.json_decode(payload)
    local index = decoded['index']
    if #decks == 1 then
        userMetadata['deck'] = nil
    else
        table.remove(decks, index)
        userMetadata['deck'] = decks
    end

    local error = nk.account_update_id(context.user_id, userMetadata)
    if not error then return nk.json_encode({success = true}) end
end

local function select_deck(context, payload)
    local account = nk.account_get_id(context.user_id)
    local userMetadata = account.user.metadata

    local decoded = nk.json_decode(payload)
    local index = decoded['index']

    userMetadata['current_deck'] = index
    local error = nk.account_update_id(context.user_id, userMetadata)
    if not error then return nk.json_encode({success = true}) end
end

nk.register_rpc(get_card_info, 'get_card_info')
nk.register_rpc(try_draw_card, "try_draw_card")

nk.register_rpc(add_deck, 'add_deck')
nk.register_rpc(modify_deck, 'modify_deck')
nk.register_rpc(delete_deck, 'delete_deck')
nk.register_rpc(select_deck, 'select_deck')

return ability


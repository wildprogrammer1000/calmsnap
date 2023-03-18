local nk = require("nakama")
local ability = require("card")
local MATCH_INIT = 1
local MATCH_READY = 2
local MATCH_START = 3
local PLAYER_JOIN = 4
local PLAYER_READY = 5
local MATCH_ABORTED = 6
local FINISH_TURN = 7
local TURN_PASSED = 8
local PLAY_CARD = 9
local COLLECT_CARD = 10
local MATCH_RESULT = 11
local REQUEST_REWARD = 12

local STATE_IDLE = 1
local STATE_READY = 2
local STATE_START = 3
local STATE_PLAY = 4
local STATE_END = 5

local calmsnap = {}

local function indexOf(table, value)
    for i, v in ipairs(table) do if v == value then return i end end
    return -1
end
local function shuffle(arr)
    for i, v in ipairs(arr) do
        local random = math.random(#arr)
        arr[i], arr[random] = arr[random], arr[i]
    end
    return arr
end

local function update_record(user_id, win)
    local account = nk.account_get_id(user_id)
    local userMetadata = account.user.metadata
    local totalGame = (userMetadata['total_game']) and
                          (userMetadata['total_game']) or 0
    local winCount =
        (userMetadata['win_count']) and (userMetadata['win_count']) or 0
    local loseCount = (userMetadata['lose_count']) and
                          (userMetadata['lose_count']) or 0

    totalGame = totalGame + 1
    userMetadata['total_game'] = totalGame
    if win == 1 then
        winCount = winCount + 1
        userMetadata['win_count'] = winCount
    end
    nk.account_update_id(user_id, userMetadata)
end

local function get_result(state)
    local players = state.players
    local runtime = state.runtime
    local map = runtime.map

    local scoreTable = {area_1 = {}, area_2 = {}, area_3 = {}}
    local resultTable = {}
    for area_key, area in pairs(map) do
        local temp_winner = ""
        local temp_score = 0
        for _, player in pairs(players) do
            print("check", area_key, player.user_id)
            local score = 0;
            if area[player.user_id] then
                for index, card in ipairs(area[player.user_id]) do
                    score = score + ability[card].power
                end
            end
            if score ~= 0 then
                if score > temp_score then
                    temp_winner = player.user_id
                    score = temp_score
                    print("plus", player.user_id, score, temp_score)
                elseif score == temp_score then
                    temp_winner = ""
                end
                scoreTable[area_key][player.user_id] = score
            end
        end
        if temp_winner ~= "" then
            if resultTable[temp_winner] then
                resultTable[temp_winner] = resultTable[temp_winner] + 1
            else
                resultTable[temp_winner] = 1
            end
        end
    end

    -- print("RESULT TABLE", nk.json_encode(scoreTable))
    print("RESULT TABLE", nk.json_encode(resultTable))
    local winner = ""
    local winner_score = 0

    for user_id, score in pairs(resultTable) do
        if score > winner_score then
            winner = user_id
            winner_score = score
        end
    end

    -- print("winner", winner, winner_score)

    for user_id, player in pairs(state.players) do
        if user_id == winner then
            update_record(user_id, 1);
        else
            update_record(user_id, 0);
        end
    end

    return winner, winner_score

    -- Area마다 score를 비교해서 win_count
    -- win_count가 더 높은 player 승리

end

local function draw(state, user_id)
    local player = state.players[user_id]
    local card = (player.card) and player.card or {}
    local deck = (player.deck) and player.deck or {}
    if #deck == 0 then return end
    print("Card 1", nk.json_encode(card))
    print("Deck 1", nk.json_encode(deck))

    local next_card = deck[1]
    table.insert(card, next_card)
    table.remove(deck, 1)
    player.card = card
    player.deck = deck

    print("Card 2", nk.json_encode(card))
    print("Deck 2", nk.json_encode(deck))

end

local function initialize_card(state)
    local players = state.players
    for k, v in pairs(players) do
        local account = nk.account_get_id(k)
        local userMetadata = account.user.metadata
        local deck = userMetadata['deck']
        local current_deck = userMetadata['current_deck']

        local shuffled_deck = shuffle(deck[current_deck])
        v.deck = shuffled_deck
        for i = 1, 3 do draw(state, v.user_id) end
    end
end

local function game_initialize(state, dispatcher)
    local rt = state.runtime
    rt.started = true
    local players = state.players
    print('players', nk.json_encode(players))
    initialize_card(state)

    local name = {}
    for k, v in pairs(players) do
        name[k] = v.username
        v.energy = 1
        -- change display_name
    end

    for k, v in pairs(players) do
        local game_info = {
            card = v.card,
            energy = v.energy,
            turn = 1,
            name = name
        }
        dispatcher.broadcast_message_deferred(MATCH_START, nk.json_encode(
                                                  {
                game_info = game_info,
                runtime = rt
            }), {v})
    end

    print("initialized", nk.json_encode(state.players))
end

local function on_player_join(context, dispatcher, tick, state, message)
    local player = state.players[message.sender.user_id]
    if not player then return end
    local rt = state.runtime
    rt.confirmed = rt.confirmed + 1
end

local function on_player_ready(context, dispatcher, tick, state, message)
    local player = state.players[message.sender.user_id]
    if not player then return end
    local rt = state.runtime
    rt.confirmed = rt.confirmed + 1
end

local function on_finish_turn(context, dispatcher, tick, state, message)
    local player = state.players[message.sender.user_id]
    if not player then return end
    local rt = state.runtime
    rt.confirmed = rt.confirmed + 1
end

local function on_play_card(context, dispatcher, tick, state, message)
    local player = state.players[message.sender.user_id]
    if not player then return end
    local decoded = nk.json_decode(message.data)
    local rt = state.runtime

    local area_index = decoded['area'] + 1
    local target_area = rt.map["area_" .. area_index]
    local player_area = target_area[player.user_id]
    if player_area and #player_area == 4 then return end
    local player_card = player.card
    local card_index = indexOf(player_card, decoded['card'])
    table.remove(player_card, card_index)

    local user_id = player.user_id
    if player['energy'] == 0 or player['energy'] < ability[decoded['card']].cost then
        return
    end
    player['energy'] = player['energy'] - ability[decoded['card']].cost
    decoded['user_id'] = user_id
    decoded['energy'] = player.energy
    if player_area then
        table.insert(player_area, decoded['card'])
    else
        target_area[player.user_id] = {decoded['card']}
    end
    dispatcher.broadcast_message_deferred(PLAY_CARD, nk.json_encode(decoded),
                                          {player})
end

local function on_collect_card(context, dispatcher, tick, state, message)
    -- local player = state.players[message.sender.user_id]
    -- if not player then return end
    -- local decoded = nk.json_decode(message.data)
    -- local rt = state.runtime

    -- local area_index = decoded['area'] + 1
    -- local target_area = rt.map["area_" .. area_index]
    -- local player_card = player.card
    -- table.insert(player_card, decoded['card'])
    -- local index = indexOf(target_area[player.user_id], decoded['card'])
    -- table.remove(target_area[player.user_id], index)

end
local function on_request_reward(context, dispatcher, tick, state, message)
    local player = state.players[message.sender.user_id]
    if not player then return end

    local runtime = state.runtime
    print('WINNER', runtime.winner)
    if runtime.winner == player.user_id then
        runtime.winner = ""
        local changeset = {point = 1000}
        local w_metadata = {type = "win"}
        nk.wallet_update(player.user_id, changeset, w_metadata, true)
        dispatcher.broadcast_message_deferred(REQUEST_REWARD,
                                              nk.json_encode(changeset),
                                              {player})
    end
end

local function running_fsm(context, dispatcher, tick, state)
    local rt = state.runtime
    if state.state == STATE_IDLE then
        if rt.confirmed == 2 then
            state.state = STATE_READY
            rt.confirmed = 0
            dispatcher.broadcast_message_deferred(MATCH_READY)
        end
    elseif state.state == STATE_READY then
        if rt.confirmed == 2 then
            state.state = STATE_PLAY
            rt.confirmed = 0
            game_initialize(state, dispatcher)
        end

        -- elseif state.state == STATE_START then
        --     if rt.confirmed == 2 then
        --         print("GAME STARTED!!")
        --         state.state = STATE_PLAY
        --         rt.confirmed = 0
        --     end

    elseif state.state == STATE_PLAY then
        if rt.confirmed == 2 then
            for _, player in pairs(state.players) do
                player.energy = rt.turn + 1
            end
            if rt.turn < 6 then
                rt.turn = rt.turn + 1

                local name = {}
                for k, v in pairs(state.players) do
                    name[k] = v.username
                    -- change display_name
                end
                for k, v in pairs(state.players) do
                    draw(state, v.user_id)
                    local game_info = {
                        card = v.card,
                        energy = rt.turn,
                        name = name,
                        map = rt.map,
                        turn = rt.turn
                    }
                    dispatcher.broadcast_message_deferred(TURN_PASSED,
                                                          nk.json_encode(
                                                              game_info), {v})
                end
            else
                print('GAME END!!')
                local winner_id, winner_score = get_result(state)
                dispatcher.broadcast_message_deferred(MATCH_RESULT,
                                                      nk.json_encode(
                                                          {winner = winner_id}))
                rt.winner = winner_id
                rt.started = false
                state.state = STATE_END
            end
            rt.confirmed = 0
        end

    elseif state.state == STATE_END then
        if rt.confirmed == 2 then
            state.state = STATE_IDLE
            rt.winner = ""
            rt.confirmed = 0
        end

    end
end

local message_table = {
    [PLAYER_JOIN] = on_player_join,
    [PLAYER_READY] = on_player_ready,
    [FINISH_TURN] = on_finish_turn,
    [PLAY_CARD] = on_play_card,
    [COLLECT_CARD] = on_collect_card,
    [REQUEST_REWARD] = on_request_reward
}

function calmsnap.match_init(context, setupstate)
    local gamestate = {
        state = STATE_IDLE,
        players = {},
        player_count = 0,
        turn = 1,
        runtime = {
            started = false,
            confirmed = 0,
            turn = 1,
            turn_duration = 30,
            winner = "",
            map = {area_1 = {}, area_2 = {}, area_3 = {}}
        }
    }
    local tickrate = 1
    local label = "calmsnap"
    return gamestate, tickrate, label
end
function calmsnap.match_join_attempt(context, dispatcher, tick, state, presence)
    local acceptuser = true
    if state.player_count == 2 then acceptuser = false end

    state.players[presence.user_id] = presence
    state.player_count = state.player_count + 1

    return state, acceptuser
end
function calmsnap.match_join(context, dispatcher, tick, state, presences)
    dispatcher.broadcast_message_deferred(MATCH_INIT, nk.json_encode(
                                              {players = state.players}),
                                          presences)
    return state
end
function calmsnap.match_leave(context, dispatcher, tick, state, presences)
    local rt = state.runtime
    for _, presence in ipairs(presences) do
        state.players[presence.user_id] = nil
        print('players after leave', nk.json_encode(state.players))
        state.player_count = state.player_count - 1
        rt.confirmed = rt.confirmed - 1
    end
    if rt.started then
        -- 남아있는 사람 보상 지급
        for id, player in pairs(state.players) do

            local changeset = {point = 500}
            local w_metadata = {type = "reward"}
            local updated = nk.wallet_update(id, changeset, w_metadata)
            if updated then
                dispatcher.broadcast_message_deferred(MATCH_ABORTED,
                                                      nk.json_encode(changeset),
                                                      {player})
            end
        end
        rt.started = false
    end
    if state.player_count > 0 then
        return state
    else
        return nil
    end
end
function calmsnap.match_loop(context, dispatcher, tick, state, messages)
    if #messages > 0 then
        for _, message in ipairs(messages) do
            if message_table[message.op_code] then
                message_table[message.op_code](context, dispatcher, tick, state,
                                               message)
            end
        end
    end

    local rt = state.runtime

    running_fsm(context, dispatcher, tick, state)

    return state
end
function calmsnap.match_terminate(context, dispatcher, tick, state,
                                  grace_seconds) return nil end
function calmsnap.match_signal(context, dispatcher, tick, state, data)
    return state
end

return calmsnap

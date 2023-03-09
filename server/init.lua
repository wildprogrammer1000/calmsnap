local nk = require('nakama')

local function set_card_db()
    local card_json = nk.json_decode(nk.file_read("./card.json"))

    local count = 0;
    for k, v in pairs(card_json) do count = count + 1 end

    local storage_config = {
        {
            collection = "shop",
            key = "card",
            value = {card = card_json, count = count}
        }
    }
    nk.storage_write(storage_config);
end

nk.run_once(set_card_db, "set_card_db")

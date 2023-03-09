local nk = require('nakama')

local function matching(context, payload)
    local limit = 1;
    local authoritative = true
    local label = "calmsnap"
    local min_size = 1
    local max_size = 1
    local matches = nk.match_list(limit, authoritative, label, min_size,
                                  max_size)

    if #matches == 0 then
        -- create match
        local module = "calmsnap"
        local new_match_id = nk.match_create(module)
        return new_match_id
    else
        -- join match
        return matches[1].match_id
    end
end

nk.register_rpc(matching, 'matching')

import { createSlice } from "@reduxjs/toolkit";

export const account = createSlice({
  name: "account",
  initialState: {
    value: null,
  },
  reducers: {
    refresh: (state, action) => {
      const payload = action.payload;
      state.value = payload;
    },
  },
});

export const { refresh } = account.actions;

export default account.reducer;

import {mutation, query} from "./_generated/server";

export const ping = query({
    args: {},
    handler: async (ctx) => {
        const latest = await ctx.db.query("health").order("desc").first();
        return {serverTime: Date.now(), count: latest?.count ?? 0};
    },
});

export const touch = mutation({
    args: {},
    handler: async (ctx) => {
        const latest = await ctx.db.query("health").order("desc").first();
        if (latest) {
            await ctx.db.patch(latest._id, {count: latest.count + 1});
        } else {
            await ctx.db.insert("health", {count: 1});
        }
    },
});

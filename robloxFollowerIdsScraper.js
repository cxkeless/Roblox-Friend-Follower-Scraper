(async () => {
  const identifier = prompt(
    "Enter Roblox username or userId of the player whose followers/friends you want to scrape:"
  );
  if (!identifier) {
    console.warn("No userId or username provided.");
    return;
  }
  async function resolveUserId(nameOrId) {
    if (/^\d+$/.test(nameOrId)) return Number(nameOrId);
    const resp = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [nameOrId], excludeBannedUsers: false }),
    });
    const json = await resp.json();
    return json.data?.[0]?.id || null;
  }
  const userId = await resolveUserId(identifier);
  if (!userId) {
    console.error("Invalid userId or username provided.");
    return;
  }
  console.log(`Resolved userId: ${userId}`);
  const modeInput = prompt('What would you like to scrape? Type "followers" or "friends" (default: followers):');
  const mode = (modeInput || "followers").toLowerCase().startsWith("friend") ? "friends" : "followers";
  const noun = mode === "friends" ? "friend" : "follower";
  const scrapedIds = [];
  let cursor = "";
  const pageSize = 100;
  while (true) {
    const url = `https://friends.roblox.com/v1/users/${userId}/${mode}?limit=${pageSize}&cursor=${encodeURIComponent(cursor)}`;
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      console.error("Request failed:", res.status, res.statusText);
      break;
    }
    const data = await res.json();
    if (Array.isArray(data.data)) {
      scrapedIds.push(...data.data.map((u) => u.id));
      console.log(`Fetched ${scrapedIds.length} ${noun} ids so far...`);
    }
    if (!data.nextPageCursor) break;
    cursor = data.nextPageCursor;
    await new Promise(r => setTimeout(r, 250));
  }
  console.log(`Finished! Collected ${scrapedIds.length} ${noun} IDs for userId ${userId}.`);
  console.log(scrapedIds);
  const idsText = scrapedIds.join("\n");
  const capitalizedNoun = noun[0].toUpperCase() + noun.slice(1);
  await navigator.clipboard.writeText(idsText);
  console.log(`${capitalizedNoun} IDs copied to clipboard!`);
})(); 

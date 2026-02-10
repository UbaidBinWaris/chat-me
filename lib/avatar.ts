export function getAvatar(username: string, imageUrl?: string | null) {
    if (imageUrl) return imageUrl;

    // Use DiceBear Avatars (Initials style or Avataaars)
    // Using 'initials' is often cleaner for chat apps, but 'avataaars' is more fun. 
    // The user mentioned "generate the random image", so let's use a visual style like 'avataaars' or 'bottts' or 'identicon'.
    // Let's use 'avataaars' for a human feel or 'initials' if preferred. 
    // Given the "cool aesthetic" request, 'avataaars' or 'notionists' (if available) are good.
    // user said "random image of new user", let's stick to standard `avataaars` or `micah` which are popular.
    // Let's go with `avataaars` as a safe default for "random image".

    // We need to encode the seed to handle special characters
    const seed = encodeURIComponent(username || "User");
    return `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}`;
}

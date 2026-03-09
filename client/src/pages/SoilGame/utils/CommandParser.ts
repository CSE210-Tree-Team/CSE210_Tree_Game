// ========================
// Command Parsing
// ========================

/** Check if a string is a valid player command */
export function isValidCommand(input: string): boolean {
	const normalized = input.toLowerCase().trim();
	if (['w', 'a', 's', 'd', '1', '2', '3', 'i', 'exit'].includes(normalized)) return true;

	const parts = normalized.split(/\s+/);
	if ((parts[0] === 'collect' || parts[0] === 'drop') && parts.length === 3) {
		const amount = parseInt(parts[2], 10);
		if (!isNaN(amount) && amount > 0) return true;
	}

	return false;
}

/**
 * Normalizes the input command to lowercase form
 */
export function parseCommand(input: string): string {
	return input.toLowerCase().trim();
}

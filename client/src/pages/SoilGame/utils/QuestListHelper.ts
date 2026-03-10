import {
	type Node,
	type Position,
	type Inventory,
	type Quest,
	type ElementType,
	SYMBOL_TO_ELEMENT,
} from '../types/Abstract.types';

// ========================
// Quest Helpers
// ========================

/** Get the next needed element for a quest, returns null if quest is complete */
export function getNextNeededElement(quest: Quest): { element: ElementType; remaining: number } | null {
	for (const [element, required] of Object.entries(quest.required)) {
		const submitted = quest.submitted[element] || 0;
		if (submitted < required) {
			return { element: element as ElementType, remaining: required - submitted };
		}
	}
	return null;
}

/** 
 * Checks if the inventory has enough resources to complete the quest.
 * If so, returns the updated quest and inventory.
 * Otherwise returns null.
 */
export function checkAndCompleteQuest(
	quest: Quest,
	inventory: Inventory
): { updatedQuest: Quest; updatedInventory: Inventory } | null {
	if (quest.completed) return null;

	const newInventory = { ...inventory };
	const newSubmitted = { ...quest.submitted };

	// Check if we have enough of EVERYTHING required
	for (const [element, requiredCount] of Object.entries(quest.required)) {
		const symbol = element; // The key in quest.required is the symbol (e.g. "H")
		const elementName = SYMBOL_TO_ELEMENT[symbol] || symbol; // The key in inventory is the element name (e.g. "Hydrogen")

		const currentInInventory = inventory[elementName] || 0;
		if (currentInInventory < requiredCount) {
			return null; // Not enough of this resource
		}

		// Prepare the updates
		newInventory[elementName] -= requiredCount;
		newSubmitted[symbol] = requiredCount;
	}

	const updatedQuest: Quest = {
		...quest,
		submitted: newSubmitted,
		completed: true,
	};

	return { updatedQuest, updatedInventory: newInventory };
}

// ========================
// Terminal Log Helpers
// ========================

/** Format quest progress string */
export function formatQuestProgress(quest: Quest): string {
	const parts: string[] = [];
	for (const [element, required] of Object.entries(quest.required)) {
		const submitted = quest.submitted[element] || 0;
		parts.push(`${submitted}/${required} ${element}`);
	}
	return parts.join(', ');
}

/** Get chemical symbol for an element 
 */
export function getElementSymbol(element: ElementType): string {
	for (const [symbol, name] of Object.entries(SYMBOL_TO_ELEMENT)) {
		if (name === element) return symbol;
	}
	return element; // Fallback to element name/symbol itself
}

/** Format the location info block for terminal */
export function formatLocationInfo(pos: Position, map: Node[][]): string[] {
	const node = map[pos.y][pos.x];
	const info: string[] = [`Coordinates: [X: ${pos.x}, Y: ${pos.y}]`];
	if (node.resources && Object.keys(node.resources).length > 0) {
		if (node.collected) {
			info.push('Status: Area cleared.');
		} else {
			info.push('Sensors detecting resources:');
			// Loop through resources like { Nitrogen: 2, Oxygen: 1 }
			Object.entries(node.resources).forEach(([element, count]) => {
				if (count > 0) {
					info.push(`  - ${element}: ${count} units`);
				}
			});
			info.push('Type "collect" to gather these items.');
		}
	} else {
		info.push('Status: No resources detected in this sector.');
	}
	return info;
}


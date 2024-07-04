export const capitalize = (input: string): string => {
	if (!input) {
		return input; // Return unchanged if the input is falsy (null, undefined, empty string, etc.)
	}

	return input.charAt(0).toUpperCase() + input.slice(1);
};

// Helpers to derive command and status topics from a base topic string
export const getCommandTopic = (topicStr: string) => {
	if (topicStr.endsWith('/#')) {
		return topicStr.replace(/\/#$/, '/command')
	}
	return topicStr
}

export const getStatusTopic = (topicStr: string) => {
	if (topicStr.endsWith('/#')) {
		return topicStr.replace(/\/#$/, '/status')
	}
	return topicStr
}

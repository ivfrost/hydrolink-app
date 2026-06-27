import '@/global.css'
import { areasQuery } from '@/queries/areas'
import { useQuery } from '@tanstack/react-query'
import { StyleSheet, Text, View } from 'react-native'

export default function Index() {
	const { data: areas, isPending, error } = useQuery(areasQuery)

	return (
		<View style={styles.container}>
			{isPending && <Text>Loading...</Text>}
			{error && <Text>Error: {error.message}</Text>}
			{areas && (
				<View>
					<Text>Areas:</Text>
					<Text>{JSON.stringify(areas, null, 2)}</Text>
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
})

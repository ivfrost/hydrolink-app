import { Text, StyleSheet, Animated } from 'react-native'
import { useScrollY } from '@/context/ScrollContext'

export default function ProfileScreen() {
	const scrollY = useScrollY()

	const styles = StyleSheet.create({
		scrollContent: {
			paddingHorizontal: 14,
			gap: 28,
		},
	})

	return (
		<Animated.ScrollView
			onScroll={Animated.event(
				[{ nativeEvent: { contentOffset: { y: scrollY } } }],
				{ useNativeDriver: true },
			)}
			scrollEventThrottle={16}
			contentContainerStyle={styles.scrollContent}
		>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
			<Text>Profile</Text>
		</Animated.ScrollView>
	)
}

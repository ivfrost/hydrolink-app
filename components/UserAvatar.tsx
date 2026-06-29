import { useMemo } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { Style, Avatar } from '@dicebear/core'
import shapeGrid from '@dicebear/styles/shape-grid.json' with { type: 'json' }
import { SvgXml } from 'react-native-svg'
import { useTheme } from '@/theme'

const style = new Style(shapeGrid)

interface UserAvatarProps {
	seed?: string
	size?: number
	onPress?: () => void
}

export default function UserAvatar({
	seed = 'Alice',
	size = 64,
	onPress,
}: UserAvatarProps) {
	const theme = useTheme()

	const avatar = useMemo(() => {
		return new Avatar(style, {
			seed,
			size: 128,
		}).toString()
	}, [seed])

	const styles = StyleSheet.create({
		ring: {
			width: size + 8,
			height: size + 8,
			borderRadius: (size + 8) / 2,
			borderWidth: 2,
			borderColor: theme.illustrationPrimary,
			justifyContent: 'center',
			alignItems: 'center',
			shadowColor: theme.illustrationPrimary,
			shadowOpacity: 0.25,
			shadowRadius: 10,
			shadowOffset: { width: 0, height: 4 },
			elevation: 4,
		},
		avatarWrapper: {
			width: size,
			height: size,
			borderRadius: size / 2,
			overflow: 'hidden',
			backgroundColor: theme.surface,
		},
	})

	const content = (
		<View style={styles.ring}>
			<View style={styles.avatarWrapper}>
				<SvgXml xml={avatar} width={size} height={size} />
			</View>
		</View>
	)

	if (onPress) {
		return (
			<Pressable
				onPress={onPress}
				style={({ pressed }) => ({
					opacity: pressed ? 0.85 : 1,
					transform: [{ scale: pressed ? 0.96 : 1 }],
				})}
			>
				{content}
			</Pressable>
		)
	}

	return content
}

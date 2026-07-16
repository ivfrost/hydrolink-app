import { useMemo } from 'react'
import { Image } from 'react-native'
import { SvgXml } from 'react-native-svg'

import { Avatar, Style } from '@dicebear/core'
import shapeGrid from '@dicebear/styles/shape-grid.json' with { type: 'json' }

import { CircleMedia } from './CircleMedia'

const style = new Style(shapeGrid)

interface UserAvatarProps {
	seed?: string
	imageUrl?: string | null
	size?: number
	onPress?: () => void
}

export function UserAvatar({
	seed = 'Alice',
	imageUrl,
	size = 64,
	onPress,
}: UserAvatarProps) {
	const avatarXml = useMemo(() => {
		if (imageUrl) return null
		return new Avatar(style, { seed, size: 128 }).toString()
	}, [seed, imageUrl])

	return (
		<CircleMedia size={size} onPress={onPress}>
			{imageUrl ? (
				<Image
					source={{ uri: imageUrl }}
					style={{ width: size, height: size }}
					resizeMode="cover"
				/>
			) : (
				<SvgXml xml={avatarXml!} width={size} height={size} />
			)}
		</CircleMedia>
	)
}

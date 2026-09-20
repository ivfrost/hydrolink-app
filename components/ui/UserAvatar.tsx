import { useMemo } from 'react'
import { SvgXml } from 'react-native-svg'

import { Avatar, Style } from '@dicebear/core'
import shapeGrid from '@dicebear/styles/shape-grid.json' with { type: 'json' }
import { Image } from 'expo-image'

import { CircleMedia } from './CircleMedia'
import resolveImageUrl from '@/utils/resolveImageUrl'

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
	const resolvedImageUrl = useMemo(
		() => resolveImageUrl(imageUrl),
		[imageUrl],
	)

	return (
		<CircleMedia size={size} onPress={onPress}>
			{resolvedImageUrl ? (
				<Image
					source={resolvedImageUrl}
					cachePolicy="memory-disk"
					contentFit="cover"
					style={{ width: size, height: size }}
				/>
			) : (
				<SvgXml xml={avatarXml!} width={size} height={size} />
			)}
		</CircleMedia>
	)
}

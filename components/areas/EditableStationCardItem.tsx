import { View } from 'react-native'

import StationCardItem, { StationCardItemProps } from './StationCardItem'

export default function EditableStationCardItem({
	isMqttEditable: boolean,
	...props
}: StationCardItemProps & { isMqttEditable: boolean }) {
	return (
		<View
			style={{
				flexDirection: 'row',
				flex: 1,
				width: '100%',
				alignItems: 'center',
			}}
		>
			<View style={{ flex: 1 }}>
				<StationCardItem {...props} isEditable isMqttEditable />
			</View>
		</View>
	)
}

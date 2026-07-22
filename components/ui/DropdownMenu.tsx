import { useState } from 'react'

import Delete from '@expo/material-symbols/delete.xml'
import Edit from '@expo/material-symbols/edit.xml'
import RestartAlt from '@expo/material-symbols/restart_alt.xml'
import Wifi from '@expo/material-symbols/wifi.xml'
import {
	Column,
	DropdownMenuItem,
	Host,
	Icon,
	DropdownMenu as RNDropdownMenu,
	RNHostView,
	Row,
	Text,
} from '@expo/ui/jetpack-compose'
import { fillMaxWidth, paddingAll } from '@expo/ui/jetpack-compose/modifiers'

import { useTheme } from '@/context/ThemeContext'
import { AreaMenuOptionValue } from '@/data/area'

import Button from './Button'

export default function DropdownMenu({
	options,
	onClick,
}: {
	options: Map<string, AreaMenuOptionValue[]>
	onClick: (option: AreaMenuOptionValue) => void
}) {
	const [isExpanded, setIsExpanded] = useState(false)
	const theme = useTheme()

	return (
		<Host matchContents seedColor={theme.colors.accentBlue}>
			<RNDropdownMenu
				expanded={isExpanded}
				onDismissRequest={() => setIsExpanded(false)}
				color={theme.colors.card}
			>
				<RNDropdownMenu.Trigger>
					<RNHostView matchContents>
						<Button
							variant="tertiary"
							modifier={['iconOnly']}
							icon="dots-vertical"
							onPress={() => setIsExpanded(true)}
							hapticFeedback={false}
						/>
					</RNHostView>
				</RNDropdownMenu.Trigger>

				<RNDropdownMenu.Items>
					{Array.from(options.entries()).map(([header, values]) => (
						<Column key={header} modifiers={[fillMaxWidth()]}>
							<Row modifiers={[fillMaxWidth(), paddingAll(theme.space.sm)]}>
								<Text style={{ fontWeight: '600' }}>{header}</Text>
							</Row>

							{values.map((value) => (
								<DropdownMenuItem
									key={value}
									elementColors={{
										textColor: theme.colors.textPrimary,
										leadingIconColor: theme.colors.textPrimary,
									}}
									onClick={() => {
										setIsExpanded(false)
										onClick(value)
									}}
								>
									<DropdownMenuItem.Text>
										<Text>{value[0].toUpperCase() + value.slice(1)}</Text>
									</DropdownMenuItem.Text>
									<DropdownMenuItem.LeadingIcon>
										{value === AreaMenuOptionValue.Edit ? (
											<Icon source={Edit} />
										) : value === AreaMenuOptionValue.Unlink ? (
											<Icon source={Delete} />
										) : value === AreaMenuOptionValue.Reboot ? (
											<Icon source={RestartAlt} />
										) : value === AreaMenuOptionValue.Connectivity ? (
											<Icon source={Wifi} />
										) : null}
									</DropdownMenuItem.LeadingIcon>
								</DropdownMenuItem>
							))}
						</Column>
					))}
				</RNDropdownMenu.Items>
			</RNDropdownMenu>
		</Host>
	)
}

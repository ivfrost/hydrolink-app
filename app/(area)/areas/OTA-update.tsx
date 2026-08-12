import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { useMutation } from '@tanstack/react-query'
import * as Burnt from 'burnt'
import * as DocumentPicker from 'expo-document-picker'

import ScrollView from '@/components/layout/ScrollView'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Picker } from '@/components/ui/Picker'
import { useTheme } from '@/context/ThemeContext'
import { firmwareUploadFn } from '@/mutations/storage'
import { AppError } from '@/types/api'
import { FileUploadPayload } from '@/types/storage'

export default function AdminBinUpload() {
	const theme = useTheme()
	const [file, setFile] = useState<FileUploadPayload | null>(null)
	const [version, setVersion] = useState('')
	const [forceInstall, setForceInstall] = useState(false)
	const technicalNameOptions = [
		{ label: 'hydrolink-core-1', value: 'hydrolink-core-1' },
	]
	const [technicalName, setTechnicalName] = useState<
		(typeof technicalNameOptions)[number]['value']
	>(technicalNameOptions[0].value)

	const { mutateAsync: uploadFirmwareAsync, isPending: isUploadingFirmware } =
		useMutation({
			mutationKey: ['uploadFirmware'],
			mutationFn: ({
				payload,
				technicalName,
				version,
			}: {
				payload: FileUploadPayload
				technicalName: string
				version: string
			}) => firmwareUploadFn(payload, technicalName, version),
			onError: (error: AppError) => {
				Burnt.toast({
					title:
						error.code === 'UNKNOWN_ERROR'
							? 'Firmware upload failed'
							: error.message,
					preset: 'error',
				})
			},
			onSuccess: () => {
				Burnt.toast({
					title: 'Firmware uploaded successfully',
					preset: 'done',
				})
			},
		})

	const pickFile = async () => {
		try {
			const result = await DocumentPicker.getDocumentAsync({
				type: ['application/octet-stream', 'application/x-binary', '*/*'],
				copyToCacheDirectory: true,
				multiple: false,
			})

			if (result.canceled || result.assets.length === 0) return

			const asset = result.assets[0]

			if (!asset.name.toLowerCase().endsWith('.bin')) {
				Burnt.toast({
					title: 'Please select a .bin firmware file',
					preset: 'error',
				})
				return
			}

			setFile({
				uri: asset.uri,
				name: asset.name,
				type: 'application/octet-stream',
				forceInstall,
			})
		} catch (error) {
			console.error('Error picking document:', error)
			Burnt.toast({
				title: 'Failed to pick firmware file',
				preset: 'error',
			})
		}
	}

	const handleUpload = async () => {
		if (!file) {
			Burnt.toast({
				title: 'Select a firmware .bin file first',
				preset: 'error',
			})
			return
		}
		if (!technicalName.trim()) {
			Burnt.toast({ title: 'Technical name is required', preset: 'error' })
			return
		}
		if (!version.trim()) {
			Burnt.toast({ title: 'Version is required', preset: 'error' })
			return
		}

		try {
			const payload: FileUploadPayload = {
				...file,
				forceInstall,
			}
			await uploadFirmwareAsync({
				payload,
				technicalName: technicalName.trim(),
				version: version.trim(),
			})
		} catch (error) {
			console.error('Error uploading firmware:', error)
		}
	}

	return (
		<ScrollView>
			<View style={styles.content}>
				<Text
					style={[styles.description, { color: theme.colors.textSecondary }]}
				>
					Upload a compiled firmware (.bin) for a hydrolink device. All devices
					matching the technical name will be notified to download and flash it.
				</Text>

				<View style={styles.fileSelector}>
					<Button
						label={file ? file.name : 'Select firmware .bin file'}
						variant="secondary"
						modifier={['full', 'tall']}
						icon="file-upload-outline"
						onPress={pickFile}
					/>
				</View>

				<Picker
					label="Technical Name"
					options={technicalNameOptions}
					selectedValue={technicalName}
					onValueChange={setTechnicalName}
					modifier={['outlined', 'full']}
				/>

				<Input
					label="Version"
					value={version}
					keyboardType="decimal-pad"
					onChangeText={setVersion}
					autoCapitalize="none"
					labelBackground={theme.colors.background}
					placeholder="e.g. 2.1.0"
					placeholderTextColor={theme.colors.textMuted}
				/>

				<Button
					label="Force install"
					variant="tertiary"
					modifier={['full']}
					icon={
						forceInstall ? (
							<MaterialCommunityIcons
								name="checkbox-marked"
								size={theme.space.iconSize}
								color={theme.colors.accent}
							/>
						) : (
							<MaterialCommunityIcons
								name="checkbox-blank-outline"
								size={theme.space.iconSize}
								color={theme.colors.textMuted}
							/>
						)
					}
					extraStyles={{ justifyContent: 'flex-start', paddingLeft: 0 }}
					onPress={() => setForceInstall((prev) => !prev)}
				/>

				<Text style={[styles.forceHint, { color: theme.colors.textMuted }]}>
					When enabled, devices will install the firmware even if the version is
					the same or lower than the currently installed version.
				</Text>

				<Button
					label="Upload firmware"
					modifier={['full', 'tall']}
					icon="upload"
					loading={isUploadingFirmware}
					disabled={isUploadingFirmware || !file}
					onPress={handleUpload}
				/>
			</View>
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	content: {
		gap: 12,
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		marginBottom: 4,
	},
	fileSelector: {
		gap: 8,
	},
	fileMeta: {
		fontSize: 12,
		textAlign: 'center',
	},
	forceHint: {
		fontSize: 12,
		lineHeight: 18,
	},
})

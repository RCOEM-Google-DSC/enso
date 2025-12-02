import DataFileManager from '@renderer/components/Common/DataFileManager'

export default function TestDataPage() {
  return (
    <>
      <DataFileManager
        availableFiles={['test-data.json', 'data.json', 'copy.json']}
        defaultFile="test-data.json"
      />
    </>
  )
}

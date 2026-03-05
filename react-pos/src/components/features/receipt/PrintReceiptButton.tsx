/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState }           from 'react'
import { Printer, Loader2 }   from 'lucide-react'
import { Button }             from '@/components/ui/button'
import { useReceiptData, usePrintReceipt } from '@/hooks/usePrintReceipt'

interface Props {
  orderId  : number
  variant? : 'default' | 'outline' | 'ghost'
  size?    : 'default' | 'sm' | 'icon'
  label?   : string
}

export default function PrintReceiptButton({
  orderId,
  variant = 'outline',
  size    = 'default',
  label   = 'Print Struk',
}: Props) {
  const [enabled, setEnabled] = useState(false)
  const { data, isLoading }   = useReceiptData(orderId)
  const printReceipt          = usePrintReceipt()

  const handlePrint = () => {
    if (data) {
      printReceipt(data)
    } else {
      setEnabled(true) // trigger fetch
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePrint}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {size !== 'icon' && (
        <span className="ml-2">{isLoading ? 'Menyiapkan...' : label}</span>
      )}
    </Button>
  )
}
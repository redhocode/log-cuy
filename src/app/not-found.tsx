import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
 
export default function NotFound() {
  return (
      
      <div className='min-h-screen justify-center flex flex-col items-center'>
        <Card className='p-20 justify-center flex flex-col items-center'>
     <h1 className='text-blod text-9xl'>404</h1>
      <h2>Not Found</h2>
      <Button>
      <Link href="/">Return Home</Link>
      </Button>
    </Card>
    </div>
  )
}
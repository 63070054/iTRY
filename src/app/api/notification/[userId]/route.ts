import { v4 as uuidv4 } from "uuid"
import { ITryActivity } from '@/app/utils/ManageActivityPage/activity'
import iTryDynamoDB from "@/app/api/utils/dynamoDB"
import { NextRequest, NextResponse } from "next/server";
import { Notification } from '@/app/utils/ManageEmail/email'
// import { NotificationRow } from '@/app/components/Navbar/navbar'

export async function POST(req: Notification) { // FIXME: change Notification to NotificationRow
    
    try {
        console.log('...... SENDING NOTIFICATION')

        const {activityName, activityDetail} = req
        const notificationId = await uuidv4()

        // ----------- CURRENT DATE AND TIME ----------------
        const currentDate = new Date()

        // Format the date (month and day)
        const month = currentDate.getMonth() + 1
        const day = currentDate.getDate()
        const formattedDate = `${month}-${day}`

        // Format the time (hours and minutes)
        const hours = currentDate.getHours()
        const minutes = currentDate.getMinutes()
        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

        const paramsDynamo = {
            TableName: 'Notification',
            Item: {
                notificationId: notificationId,
                activityName: activityName,
                activityDetail: activityDetail,
                sendDate: `${formattedDate} ${formattedTime}`,
            }
        }

        const insertDynamo = await iTryDynamoDB.put(paramsDynamo).promise()
        console.log('data: ----> ', insertDynamo)
        return {
            status: 'success',
        }
    }
    catch(error) {
        console.log('error: ', error)
        return {
            status: 'error',
        }
    }
}

export async function getNotification(userId: string) {

    const paramsDynamo = {
        TableName: "Notification",
        FilterExpression: "followerId = :userId or followerId = :sendAllId",
        ExpressionAttributeValues: {
            ":userId": userId,
            ":sendAllId": "sendAllId"
        }
    }

    try {
        const allNotifications = await iTryDynamoDB.scan(paramsDynamo).promise()

        return {
            status: 'success',
            data: allNotifications
        }
    }
    catch(error) {
        throw error
    }
}

export { POST as postNotification }
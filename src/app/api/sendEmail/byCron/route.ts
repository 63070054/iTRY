import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
// import { getNotification, postNotification } from '../../notification/[userId]/route';
import { findUser, getAllUser } from '../../users/route';
import { updateNotification } from '../../notification/route';
import { ApiDataList, ApiError } from '@/app/components/global';
import { User } from 'next-auth';
import { Notification } from '@/app/utils/ManageEmail/email';
import { getActivitiesDesc } from '../../sortActivity/[user]/desc/route';
import { ActivityApiData, ITryActivity } from '@/app/utils/ManageActivityPage/activity';

export async function POST() {
    console.log('.... Sending Email and Notification.')

    try {

        // Get user and activity data
        const users = await getAllUser() as ApiDataList<User> | ApiError | undefined
        
        const activitiesStaff = await getActivitiesDesc("staff", 1, 1000000) as ActivityApiData | ApiError | undefined
        const activitiesCamper = await getActivitiesDesc("camper", 1, 1000000) as ActivityApiData | ApiError | undefined

        if (users?.status === "error" || activitiesStaff?.status === "error" || activitiesCamper?.status === "error") throw new Error("")
        const activeUsers = users?.data?.filter(user => user?.receiveEmail)

        const convertActivitiesCamper = activitiesCamper?.data || []
        const convertActivitieStaff = activitiesStaff?.data || []

        // const combinedActivies = [...convertActivitiesCamper, ...convertActivitieStaff]
        const combinedActivies = [
            ...convertActivitiesCamper.map(activity => ({ ...activity, source: 'camper' })),
            ...convertActivitieStaff.map(activity => ({ ...activity, source: 'staff' }))
        ];

        const currentDate = new Date();

        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const day = String(currentDate.getDate()).padStart(2, '0');

        const hours = String(currentDate.getHours()).padStart(2, '0');
        const minutes = String(currentDate.getMinutes()).padStart(2, '0');

        const sendDate = `${month}-${day} ${hours}:${minutes}`;
        

        // Incoming Activity in 3 days (openDate)
        const filterIncomingActivities = combinedActivies.filter(activity => {
            const dayDifference = Math.ceil((new Date(activity.openDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            return dayDifference <= 3 && dayDifference >= 0;
        })

        // Incoming Activity in 1 day (schedule for follower)
        const filterActivitesIncomingSchedule = combinedActivies.filter(activity => (activity.schedule ?? []).some(schedule => {
            const dayDifference = Math.ceil((new Date(schedule.date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
            return dayDifference <= 1 && dayDifference >= 0;
        }))

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: { // for sender
                user: process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASSWORD
            }
        })

        // <<<<<<<<<<<<<<<<<<<<<<< SEND EMAIL, FILTER BY OPEN DATE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        activeUsers?.map(async user => {

            const newNotificationArray: Notification[] = []

            filterIncomingActivities.map(async activity => {

                // Send Email
                const activityLink = `http://localhost:3000/api/activityById/${activity.source}/` + activity.activityId
                const dayDifference = Math.ceil((new Date(activity.openDate).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))

                const mailOption = {
                    from: 'itrydpd@gmail.com',
                    to: user.email,
                    subject: `🔥 ${dayDifference === 0 ? 'วันนี้ 🔥': 'อีก ' + dayDifference + ' วัน 🔥'} เตรียมพบกับกิจกรรม ${activity.activityName}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                            <div style="background-color: #ffcc00; padding: 20px; border-radius: 10px 10px 0 0;">
                                <h2 style="margin: 0; color: #333;">IT KMITL Activity!</h2>
                                <h3 style="margin: 5px 0 0; color: #333;">💖 พบกับกิจกรรม <b>${activity.activityName}</b></h3>
                            </div>
                            <div style="padding: 20px; background-color: #fff3e6;">
                                ${activity.imageUrl ? `<img src="${activity.imageUrl}" alt="activity image" style="max-width: 100%; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">` : ''}
                            </div>
                            <div style="background-color: #ffcc00; padding: 20px; border-radius: 0 0 10px 10px;">
                                <h4 style="margin: 0; color: #333;">เปิดรับสมัคร: ${activity.openDate}</h4><br>
                                <p style="margin: 5px 0 0; color: #ffcc00; text-align: center;"><a href="${activityLink}" style="color: #ffcc00; text-decoration: none; background-color: #fff; padding: 10px 20px; border-radius: 5px; display: inline-block;"><b>ดูรายละเอียดเพิ่มเติม</b></a></p>
                            </div>
                        </div>
                        `
                }
                
                // Send Notification
                const newNotification: Notification = {
                    activityId: activity.activityId ?? '',
                    activityName: activity.activityName,
                    activityDetail: 'ประกาศเปิดกิจกรรม !!',
                    sendDate: sendDate
                }

                newNotificationArray.push(newNotification)
                await transporter.sendMail(mailOption)
            })

            // <<<<<<<<<<<<<<<<<<<<<<< SEND EMAIL, FILTER BY SCHEDULE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>

            const userEmail = user.email
            user.activitiesFollow.map(async activityFollow => {

                const matchingActivity = filterActivitesIncomingSchedule.find(activityIncoming => {
                    return activityIncoming.activityId === activityFollow.activityId
                })

                if (matchingActivity) {
                    const sendSchedules = matchingActivity?.schedule.filter(scheduleItem => {
                        const dayDifference = Math.ceil((new Date(scheduleItem.date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24))
                        return dayDifference <= 1 && dayDifference > 0
                    })


                    if (sendSchedules) {

                        // Send Notification
                        const newNotification: Notification = {
                            activityId: matchingActivity.activityId ?? '',
                            activityName: `กิจกรรม "${matchingActivity?.activityName}"`,
                            activityDetail: `อย่าลืม ! ดู timeline สำหรับวันพรุ่งนี้`,
                            sendDate: sendDate
                        }

                        // Send Email
                        const mailOption = {
                            from: 'itrydpd@gmail.com',
                            to: userEmail,
                            subject: `🚨 ประกาศจากกิจกรรม ${matchingActivity?.activityName}`,
                            html: `
                                    <h3>✨ เตรียมตัวให้พร้อมสำหรับวันพรุ่งนี้ ✨</h3>
                                    ${sendSchedules.map(scheduleItem => `
                                        <p><strong>👉 ${scheduleItem.title}</strong> - ${scheduleItem.details}</p>
                                    `).join('')}
                                `
                        }
                        newNotificationArray.push(newNotification)
                        // await transporter.sendMail(mailOption)
                    }
                    
                }
                
            })

            const newNotifications: Notification[] = [...user?.notifications, ...newNotificationArray]
            // await updateNotification(user.id, user.email, newNotifications)
            console.log('<<< SendEmail and Notification seccess >>>')
        })

        return NextResponse.json({ message: "Success" }, { status: 200 })
    }

    catch(error) {
        return NextResponse.json({ message: "Error" }, { status: 500 })
    }
}


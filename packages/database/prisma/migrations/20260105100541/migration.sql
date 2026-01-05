-- AddForeignKey
ALTER TABLE "admin_adjustment_details" ADD CONSTRAINT "admin_adjustment_details_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

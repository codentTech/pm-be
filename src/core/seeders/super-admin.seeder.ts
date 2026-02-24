import { DataSource } from "typeorm";
import * as bcrypt from "bcrypt";
import { UserEntity } from "../database/entities/user.entity";
import { ROLE } from "../../common/types/roles.enum";

const SUPER_ADMIN_EMAIL = "superadmin@example.com";
const SUPER_ADMIN_PASSWORD = "SuperAdmin@123";

export async function superAdminSeeder(dataSource: DataSource): Promise<void> {
  try {
    console.log("Starting super admin seeder");

    const userRepository = dataSource.getRepository(UserEntity);

    // Check if super admin already exists
    let superAdmin = await userRepository.findOne({
      where: { Email: SUPER_ADMIN_EMAIL },
    });

    if (superAdmin) {
      if (superAdmin.SystemRole === ROLE.SUPER_ADMIN) {
        console.log("Super Admin already exists");
        return;
      }
      // Update existing user to SUPER_ADMIN role
      await userRepository.update(superAdmin.Id, { SystemRole: ROLE.SUPER_ADMIN });
      console.log("Super Admin role assigned to existing user");
      return;
    }

    // Create super admin
    const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
    superAdmin = userRepository.create({
      FullName: "Super Admin",
      Email: SUPER_ADMIN_EMAIL,
      Password: hashedPassword,
      EmailVerified: true,
      SystemRole: ROLE.SUPER_ADMIN,
    });

    await userRepository.save(superAdmin);
    console.log("Super Admin created successfully");
    console.log(`  Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`  Password: ${SUPER_ADMIN_PASSWORD}`);
  } catch (error) {
    console.error("Error in super admin seeder:", error);
    throw error;
  }
}

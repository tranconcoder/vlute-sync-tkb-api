import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entity/user.entity';
import { StudentProfile } from '../vlute/user/student/student.service';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  /**
   * Synchronizes user data from VLUTE student profile.
   * Upserts the user record.
   */
  async syncUser(profile: StudentProfile): Promise<UserDocument> {
    return this.userModel.findOneAndUpdate(
      { student_id: profile.student_id },
      {
        vlute_id: profile.vlute_id,
        student_id: profile.student_id,
        email: profile.email,
        full_name: profile.full_name,
        date_of_birth: profile.date_of_birth,
        class_id: profile.class_id,
        class_name: profile.class_name,
        major_id: profile.major_id,
        major_name: profile.major_name,
        avatar: profile.avatar,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async linkGoogleAccount(
    userId: string,
    data: {
      id: string;
      name: string;
      email: string;
      avatar: string;
    },
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        google_info: data,
        avatar: data.avatar,
      },
      { new: true },
    );
  }

  /**
   * Returns safe user info for the client (login response / /auth/me).
   */
  getUserLoginInfo(user: UserDocument) {
    return {
      _id: (user as any)._id,
      student_id: user.student_id,
      full_name: user.full_name,
      email: user.email,
      avatar: user.avatar,
      class_name: user.class_name,
      major_name: user.major_name,
      role: user.role,
    };
  }

  findAll() {
    return this.userModel.find().exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).exec();
  }
}

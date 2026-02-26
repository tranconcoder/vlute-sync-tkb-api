import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './entity/user.entity';
import { StudentProfile } from '../student/student.service';

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

  findAll() {
    return this.userModel.find().exec();
  }

  findOne(id: string) {
    return this.userModel.findById(id).exec();
  }
}

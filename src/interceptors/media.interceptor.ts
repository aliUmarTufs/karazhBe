import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GetFile } from 'src/aws/getfile.service';

@Injectable()
export class MediaInterceptor implements NestInterceptor {
  constructor(private readonly getFile: GetFile) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const _THIS = this;
    return next.handle().pipe(
      map(async function (response) {
        if (response.status == true) {
          if (response.data.length > 0) {
            for (let i = 0; i < response.data.length; i++) {
              const signUrl = await _THIS.getFile.get_s3(
                response.data[i].mediaUrl,
              );
              response.data[i].mediaUrl = signUrl.data;
            }
          } else {
            if (response.data?.ideas?.data?.length > 0) {
              for (let i = 0; i < response.data?.ideas?.data?.length; i++) {
                const signUrl = await _THIS.getFile.get_s3(
                  response.data?.ideas?.data[i]?.mediaUrl,
                );
                response.data.ideas.data[i].mediaUrl = signUrl.data;
              }
            }
            if (response.data?.drafts?.data?.length > 0) {
              for (let i = 0; i < response.data?.drafts?.data?.length; i++) {
                const signUrl = await _THIS.getFile.get_s3(
                  response.data?.drafts?.data[i]?.mediaUrl,
                );
                response.data.drafts.data[i].mediaUrl = signUrl.data;
              }
            }
            const signUrl = await _THIS.getFile.get_s3(response.data?.mediaUrl);
            response.data.mediaUrl = signUrl?.data;
          }
          return response;
        } else {
          return response;
        }
      }),
    );
  }
}
